const router = require('express').Router();
const { Project, User } = require('../models');
const withAuth = require('../utils/auth');

// landing page... account creation,,,needs a log in (protected)

// home page the purpose of this page is to desply all the blog posts 

//dashboard display all the blog post by the current user

router.get('project', withAuth, function(req, res) {

  res.render('project');
 
})

router.get('auth', function(req, res) {

  res.render('login')
})

router.post('/auth/login', async function(req, res){
  try {
    const userData = await User.findOne({where: {email: req.bodyemail } }); 

    if (userData) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password, please try again'});
    }

    const validPassword = await userData.checkPassword(req.body.email);

    if (!validPassword) {
      res 
      .status(400)
      .json({ message: 'Incorrect email or password, please try again'});
    }

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;

      res.json({user: userData, message: 'you are now loged in!' });
    });

  } catch (err) {
    res.status(400). json(error);
    }
  })


router.post('/auth/signip', async (req,res) => {

  if (req.session.logged_in)
    return res.redirect("/project")

  //sign up user
  try {
    const userData = await User.create(req.body); // should validate user input

    req.session.save(() => {
      req.session.user_id = userData.id;
      req.session.logged_in = true;

      res.render('project')
    });
  } catch (err) {
    res.render('login', {
      error: err.message
    })
  }

})

router.get('/', async (req, res) => {
  res.render('landing', {
    user: req.session.id,
  })
});

router.get('/', async (req, res) => {
  try {
    // Get all projects and JOIN with user data
    const projectData = await Project.findAll({
      include: [
        {
          model: User,
          attributes: ['name'],
        },
      ],
    });

    // Serialize data so the template can read it
    const projects = projectData.map((project) => project.get({ plain: true }));

    // Pass serialized data and session flag into template
    res.render('homepage', { 
      projects, 
      logged_in: req.session.logged_in 
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/project/:id', async (req, res) => {
  try {
    const projectData = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ['name'],
        },
      ],
    });

    const project = projectData.get({ plain: true });

    res.render('project', {
      ...project,
      logged_in: req.session.logged_in
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Use withAuth middleware to prevent access to route
router.get('/profile', withAuth, async (req, res) => {
  try {
    // Find the logged in user based on the session ID
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Project }],
    });

    const user = userData.get({ plain: true });

    res.render('profile', {
      ...user,
      logged_in: true
    });
  } catch (err) {
    res.status(500).json(err);
  }
});
module.exports = router;