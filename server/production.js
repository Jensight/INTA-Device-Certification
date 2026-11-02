const express = require('express');
const app = express();
const path = require('path');



app.use(app.router);  

app.use(express.static(path.join(__dirname,'../','dist')));

app.listen(process.env.PORT||3000);




//Path Location Strategy
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname,'../','dist','index.html'));
});

require('dns').lookup(require('os').hostname(), function (err, add, fam) {
    console.log('Application Deployed. Open it on ' +add+ ':3000/');
});
