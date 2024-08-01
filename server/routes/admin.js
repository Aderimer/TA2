const express = require('express')
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/AdminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();


// AWS S3 setup
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.AK;
const secretAccessKey = process.env.S_AK;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
})
// \\


/* OLD Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.SSS_URL + 'public/img/uploads/')
    },
    filename:(req, file, cb) => {
        console.log(file);
        cb(null, Date.now() + path.extname(file.originalname));
    }
}); */

// New Multer setup
const storage = multer.memoryStorage();


// Multer + s3 Image Upload
const upload = multer({ 
    /*storage: multerS3({
        s3: s3,
        bucket: 'ta2-galleri',
        metadata: (req, file, cb) => {
            cb(null, {fieldName: file.fieldname})
        },
        key: (req, file, cb) => {
            cb(null, Date.now().toString() + '-' + file.originalname)
        },
        filename: (req, file, cb) => {
            cb(null, Date.now().toString() + '-' + file.originalname)
        },
    })*/

        //TESTCODE
        storage: storage
})



const jwtSecret = process.env.JWT_SECRET;

const adminLayout = '../views/layouts/admin';

// Middleware to check if user is logged in/admin
const authMiddleware = (req, res, next ) => {
    const token = req.cookies.token;

    if(!token) {
        return res.status(401).json( { message: 'Unauthorized'} );
    }
    

    try {
        decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next()
    } catch(error) {
        return res.status(401).json( { message: 'Unauthorized'} );
    }
}

// Admin login
router.get('/', async (req, res) => {
    try {
        const locals = {
            title: "Admin",
            style: "/css/admin.css"
        }
        res.render('admin/index', { locals, layout: adminLayout });
    } catch(err) {
        console.log(err);
    }
});

router.post('/admin', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne( { username} );

        if(!user) {
            return res.status(401).json( { message: 'Brukernavn/passord ikke funnet.'} );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid) {
            return res.status(401).json( { message: 'Brukernavn/passord ikke funnet.'} );
        }

        const token = jwt.sign({ userId: user._id}, jwtSecret );
        res.cookie('token', token, { httpOnly: true });

        res.redirect('/admin/dashboard');

    } catch (err) {
        console.log(err);
    }
});

router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const s3 = process.env.SSS_URL;
        const locals = {
            title: "Admin Dashboard",
            style: "/css/dashboard.css"
        }

        const data = await Post.find();
        res.render('admin/dashboard', {
            locals,
            s3,
            data,
            layout: "layouts/admin"});

    } catch (error) {
        console.log(error);
    }
})




// \\


// Register Admin User
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: hashedPassword });
            if(err.code === E11000) {
                res.status(409).json({ message: 'Something went wrong'})
            }
            res.status(500).json({ message: "Internal server error!"})

        } catch (err) {
            console.log(err);
            res.send(err);

        }

    } catch (err) {
        console.log(err);
    }
})

// \\

// Create New Post
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const s3 = process.env.SSS_URL;
        const locals = {
            title: "Nytt Bilde",
            style: "/css/add.css"
        }

        const data = await Post.find()
        res.render('admin/add-post', {
            locals,
            s3,
            data,
            layout: adminLayout
        })
    } catch (error) {
        console.log(error);
    }
});


// Image Upload from post
router.post('/add-post', upload.single('image'), authMiddleware, async (req, res) => {
     try {
       
        console.log(req.body)

        try {
            /*
            let now = new Date();
            let month = now.getMonth();
            let year = now.getFullYear();


            const newPost = new Post({
                title: req.body.title,
                alt: req.body.alt,
                src: req.body.source,
                category: req.body.category,
                filename: req.file.filename,
                filepath: req.file.path,
                createdAt: month+year
            });
            const savedImage = await newPost.save();
            await Post.create(newPost);
            res.redirect('/admin/dashboard') */

            req.file.buffer

            const params = {
                Bucket: "ta2-galleri",
                Key: req.file.originalname, // Filnavn blir ikke endret automatisk, bilder med samme navn blir overridet. Hvis dette skaper problem, lag const for å autogenere unike navn.
                Body: req.file.buffer,
                ContentType: req.file.mimetype
            }

            const command = new PutObjectCommand(params);

            await s3.send(command)

            res.redirect('/admin/dashboard')

            const newPost = new Post({
                title: req.body.title,
                alt: req.body.alt,
                category: req.body.category,
                imageName: req.file.originalname
            })
            await Post.create(newPost);
        } catch (error) {

            console.log(error);

        }

    } catch (error) {

        console.log(error);
        
    }
});

// Edit post
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const s3 = process.env.SSS_URL;
        const locals = {
            title: 'Redigering',
            style: '/css/edit.css'
        }
        let slug = req.params.id;
        const data = await Post.findOne({ _id: slug })


        res.render('admin/edit-post', {
            locals,
            data,
            s3,
            layout: adminLayout
        })
       
    } catch (error) {
        console.log(error);
    }
});

router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        let now = new Date();
        let mm = String(now.getMonth() + 1).padStart(2, '0');
        let yyyy = now.getFullYear();
        now = mm + yyyy

        console.log(now)

        const slug = req.params.id;

        await Post.findByIdAndUpdate(slug, {
            title: req.body.title,
            alt: req.body.alt,
            category: req.body.category,
            updatedAt: now
        });
        res.redirect(`/admin/edit-post/${slug}`);
       
    } catch (error) {
        console.log(error);
    }
});

// Slett bilde
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.log(error);
    }
});

//Logg ut
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/')
})


module.exports = router;