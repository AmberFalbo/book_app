'use strict';

const express = require('express');
const app = express();

require('dotenv').config();
const pg = require('pg');
require('ejs');
const superagent = require('superagent');
const methodOverride = require('method-override');

// setting the view engine
app.set('view engine', 'ejs');

// global variables
const PORT = process.env.PORT || 3001;

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', error => {
  console.log('ERROR', error);
});

// middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

// routes
app.get('/', renderHomePage);
app.get('/searches/new', renderSearchPage);
app.post('/searches', collectSearchResults);
app.get('/error', handleErrors);
app.get('/books/:id', getOneBook);
app.post('/addbook', addBookToFavorites);
app.put('/update/:id', updateBook);
app.delete('/delete/:id', deleteBook);

// functions

function renderHomePage(request, response){
  let sql = 'SELECT * FROM books;';
  client.query(sql)
    .then(results => {
      let books = results.rows;
      console.log('this is books', books);
      response.render('pages/index.ejs', {book:books});
    })
}

function renderSearchPage(request, response){
  response.render('pages/searches/new.ejs')
}

function getOneBook(request, response){
  let id = request.params.id;
  let sql = 'SELECT * FROM books WHERE id=$1;';
  let safeValues = [id];

  client.query(sql, safeValues)
    .then(results => {
      console.log('This is the book I selected:', results.rows);
      let selectedBook = results.rows[0];

      response.render('pages/books/show.ejs', {book:selectedBook});
    })
}

function collectSearchResults(request, response){
  console.log('this is the form data:', request.body);
  let query = request.body.search[0];
  let category = request.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(category === 'title'){url += `+intitle:${query}`}
  if(category === 'author'){url += `+inauthor:${query}`}


  superagent.get(url)
    .then(results => {
      let bookArray = results.body.items;
      // console.log('the magic book ARRAY', bookArray);
      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      });

      console.log('this is our final book array', finalBookArray);
      response.render('pages/searches/show.ejs', {searchResults: finalBookArray})
    }).catch((error) => {
      console.log('ERROR', error);
      response.status(500).send('Sorry this is broken for a bit!');
      handleErrors(request, response);
    });

}

function handleErrors(request, response){
  response.render('pages/error.ejs')
}

function addBookToFavorites(request, response){
  console.log('this is my form data from my add to favs', request.body);

  //take the info from the form

  let { author, title, isbn, image_url, description} = request.body;
  //add it to the database

  let sql = 'INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING id;';

  let safeValues = [author, title, isbn, image_url, description];

  client.query(sql, safeValues)
    .then(results => {
      console.log('sql results', results.rows[0].id);
      let id = results.rows[0].id;
      response.status(200).redirect(`/books/${id}`);
    })
  //redirect ot the detail page
}

function updateBook(request, response) {
  let id = request.params.id;

  let { author, title, isbn, image_url, description, bookshelf} = request.body;
  console.log('request.body LOGGGGGG', request.body);
  let sql = 'UPDATE books SET author=$1, title=$2, isbn=$3, image_url=$4, description=$5, bookshelf=$6 WHERE id=$7;';
  let safeValues =[author, title, isbn, image_url, description, bookshelf, id];

  client.query(sql, safeValues)
    .then(() => {
      response.status(200).redirect('/');
    })

}

function deleteBook(request, response) {
  let id = request.params.id;

  let sql = 'DELETE FROM books WHERE id=$1;';

  let safeValues =[id]

  client.query(sql, safeValues)
    .then(() => {
      response.status(200).redirect('/');
    })
}


function Book(obj){
  this.title = obj.title ? obj.title : 'no title available';
  this.author = obj.authors ? obj.authors[0] : 'no author available';
  this.description = obj.description ? obj.description : 'no description available';
  this.image_url = obj.imageLinks ? obj.imageLinks.thumbnail.replace(/^(http:\/\/)/g, 'https://') : 'https://i.imgur.com/J5LVHEL.jpg';
  this.isbn = obj.industryIdentifiers ? (obj.industryIdentifiers[0].type + obj.industryIdentifiers[0].identifier) : 'no ISBN available';
  this.bookshelf = [];
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  });

