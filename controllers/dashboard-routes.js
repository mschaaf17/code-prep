const router = require("express").Router();
const sequelize = require("../config/connection");
const { Post, User, Comment, Likes } = require("../models");
const withAuth = require("../utils/auth");

// get all posts for dashboard
router.get("/", withAuth, (req, res) => {
  console.log(req.session);
  console.log("======================");
  Post.findAll({
    where: {
      user_id: req.session.user_id,
    },
    attributes: [
      "id",
      "post_text",
      "title",
      "created_at",
      [
        sequelize.literal(
          "(SELECT COUNT(*) FROM likes WHERE post.id = likes.post_id)"
        ),
        "likes_count",
      ],
    ],
    order: [["created_at", "DESC"]],
    include: [
      {
        model: Comment,
        attributes: ["id", "comment_text", "post_id", "user_id", "created_at"],
        include: {
          model: User,
          attributes: ["username"],
        },
      },
      {
        model: User,
        attributes: ["username"],
      },
    ],
  })
    .then(async (dbPostData) => {
      const posts = dbPostData.map((post) => post.get({ plain: true }));
      console.log(posts);

      const liked_posts_data = await User.findOne({
        where: { id: req.session.user_id },
        include: [
          {
            model: Post,
            through: Likes,
            attributes: [
              "id",
              "post_text",
              "title",
              "created_at",
              [
                sequelize.literal(
                  "(SELECT COUNT(*) FROM likes WHERE posts.id = likes.post_id)"
                ),
                "likes_count",
              ],
            ],
            order: [["created_at", "DESC"]],
            include: [
              {
                model: Comment,
                attributes: [
                  "id",
                  "comment_text",
                  "post_id",
                  "user_id",
                  "created_at",
                ],
                include: {
                  model: User,
                  attributes: ["username"],
                },
              },
              {
                model: User,
                attributes: ["username"],
              },
            ],
          },
        ],
      });
      const liked_posts = liked_posts_data.get({ plain: true });
      console.log(liked_posts);
      res.render("dashboard", {
        posts,
        liked_posts: liked_posts.posts,
        loggedIn: true,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

router.get("/edit/:id", withAuth, (req, res) => {
  Post.findByPk(req.params.id, {
    attributes: [
      "id",
      "post_text",
      "title",
      "created_at",
      [
        sequelize.literal(
          "(SELECT COUNT(*) FROM likes WHERE post.id = likes.post_id)"
        ),
        "likes_count",
      ],
    ],
    include: [
      {
        model: Comment,
        attributes: ["id", "comment_text", "post_id", "user_id", "created_at"],
        include: {
          model: User,
          attributes: ["username"],
        },
      },
      {
        model: User,
        attributes: ["username"],
      },
    ],
  })
    .then((dbPostData) => {
      if (dbPostData) {
        const post = dbPostData.get({ plain: true });

        res.render("edit-post", {
          post,
          loggedIn: true,
        });
      } else {
        res.status(404).end();
      }
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

module.exports = router;
