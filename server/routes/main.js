const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const mongoose = require('mongoose')


router.get('/', async (req, res) => {
   

    try {
        const s3 = process.env.SSS_URL;
        const locals = {
            title: "Theas Galleri",
            style: "/css/main.css"
        }

        // Pagination
        let perPage = 20;
        let page = req.query.page || 1;

        const data = await Post.aggregate([ { $sort: { createdAt: 1 } }])
        .skip(perPage * page - perPage)
        .limit(perPage)
        .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        let prevPage = parseInt(page) - 1;
        const hasPrevPage = prevPage <= Math.ceil(count / perPage);
        const hasNextPage = nextPage <= Math.ceil(count / perPage);
        if(prevPage === 0){
            prevPage = null;
        }


        res.render('index', {
            locals,
            data,
            s3,
            current: page,
            prevPage: hasPrevPage ? prevPage : null,
            nextPage: hasNextPage ? nextPage : null
         });

    } catch (error) {
        console.log(error);
    }
    //

});


// Kontakt route
router.get('/kontakt/', (req, res) => {
    const locals = {
        title: "Kontakt",
        style: "/css/kontakt.css"
    }
    res.render('kontakt', { locals });
});


// Mail sender
router.post('/kontakt/', async (req, res) => {


    const { subject, message } = req.body;
    try {

        var transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: true,
        auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PSW,
        },
    });

    var mailOptions = {
        from: '"Kontaktskjema" - Galleriet <theaem@theaem.no>',
        to: process.env.MAIL_USER,
        subject: req.body.subject,
        text: req.body.message
    }

    transporter.sendMail(mailOptions, async (res, error, info) => {
        if (error){
            console.log(error);
        } else {
            console.log("Email Sent: " + info.response)
        }
    });
    } catch (error) {
        console.log(error);
    }
    res.redirect('/');
})

// Showcase/image router
router.get('/bilde/:id', async (req, res) => {
    try {
        const s3 = process.env.SSS_URL;
        let slug = req.params.id;
        const data = await Post.findById({ _id: slug });



        const locals = {
            title: data.title,
            style: "/css/showcase.css"
        }


        var pathString = data.filepath;
        if(pathString !== undefined) {
            var imageName = pathString.replace('public\\img\\uploads\\', '')
        }

        res.render('showcase', { locals, data, s3, imageName });
    } catch (error) {
        console.log(error);
    }
});

router.post('/search', async  (req, res) => {
    try {
    const s3 = process.env.SSS_URL;
    const locals = {
        title: "Resultater",
        style: "/css/search.css"
    }

    let searchTerm = req.body.searchTerm;
    // Removes fucky characters from the search
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "")


    const data = await Post.find({
        $or: [
            { title: { $regex: new RegExp(searchNoSpecialChar, 'i') }},
            { filename: { $regex: new RegExp(searchNoSpecialChar, 'i') }}
        ]
    });
    //--\\

    res.render("search", {
        s3,
        data,
        locals
    });

    } catch (error) {
        console.log(error);
    }
});

// Router to show collections
router.get('/samlinger', (req, res) => {
  const locals = {
      title: "Samlinger",
      style: '/css/samlinger.css'
  }

  Post.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      }
    }
  ])
  .then(result => {
    res.render('samlinger', { result: result, locals });
  })
  .catch(err => {
    res.status(500).send(err);
  });
});

  // Router for individual collection
  router.get('/samlinger/:category', (req,res) => {
    const s3 = process.env.SSS_URL;
    const locals = {
        title: req.params.category,
        style: '/css/samling.css'
    }

    const category = req.params.category;
    Post.find({ category: category })
    .then(posts => {
        res.render('samling', { posts: posts, locals, s3 });
    })
    .catch(err => {
        res.status(500).send(err);
    })
  })
        



module.exports = router;