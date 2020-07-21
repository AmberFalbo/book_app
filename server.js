'use strict';

const express = require('express');
const app = express();

require('dotenv').config();
require('ejs');
const superagent = require('superagent');

// setting the view engine
app.set('view engine', 'ejs');

// global variables
const PORT = process.env.PORT || 3001;

// middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));

// app.get('/hello', renderTest);
app.get('/', renderHomePage);
app.get('/searches/new', renderSearchPage);
app.post('/searches', collectSearchResults);
app.get('/error', handleErrors);

// functions

// function renderTest(request, response){
//   response.render('pages/index');
// }

function renderHomePage(request, response){
  response.render('pages/index.ejs')
}

function renderSearchPage(request, response){
  response.render('pages/searches/new.ejs')
}

function collectSearchResults(request, response){
  console.log('this is the form data:', request.body);
  let query = request.body.search[0];
  let category = request.body.search[1];
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  if(category === 'title'){url += `+intitle:${query}`}
  if(category === 'author'){url += `+inauthor:${category}`}


  superagent.get(url)
    .then(results => {
      let bookArray = results.body.items;

      const finalBookArray = bookArray.map(book => {
        return new Book(book.volumeInfo);
      });

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



function Book(obj){
  this.title = obj.title ? obj.title : 'no title available';
  this.author = obj.authors ? obj.authors[0] : 'no author available';
  this.description = obj.description ? obj.description : 'no description available';
  this.image = obj.imageLinks ? obj.imageLinks.thumbnail.replace(/^(http:\/\/)/g, 'https://') : 'https://i.imgur.com/J5LVHEL.jpg';
}


app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
