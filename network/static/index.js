document.addEventListener("DOMContentLoaded", () => {
  AllPostsPage("all-posts");

  const allPostsNavElement = document.querySelector("#all-posts-nav");
  const FollowingNavElement = document.querySelector("#following-nav");

  allPostsNavElement.addEventListener("click", () => {
    AllPostsPage("all-posts");
  });
  FollowingNavElement.addEventListener("click", () => {
    AllPostsPage("following");
  });
});

// TODO: ProfilePage()

const fetchPosts = (page) => {
  fetch(`/api/posts/${page}`)
    .then((response) => response.json())
    .then(({ posts }) => {
      if (posts.length > 0) {
        posts.forEach((post) => {
          const postContainer = document.createElement("div");

          const poster = document.createElement("a");
          poster.textContent = post.poster;
          poster.setAttribute("href", `/api/profile/${poster}`);
          poster.addEventListener("click", () => {
            ProfilePage("profile-page");
          });

          const editButton = document.createElement("button");
          editButton.textContent = "Edit";

          const postContent = document.createElement("p");
          postContent.textContent = post.content;

          const postDate = document.createElement("p");
          postDate.textContent = post.date;

          const likesCount = document.createElement("span");
          likesCount.textContent = post.likes;

          postContainer.append(
            poster,
            editButton,
            postContent,
            postDate,
            likesCount
          );
          document.querySelector(".main-page").append(postContainer);
        });
      } else {
        document
          .querySelector(".main-page")
          .append((document.createElement("p").textContent = "No posts yet"));
      }
    });
};

// Get the CSRF token from the cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const ErrorMsg = (error) => {
  const postButton = document.querySelector("#new-post-button");
  const errorMsg = document.createElement("p");
  errorMsg.textContent = error;
  errorMsg.className = "error-msg"

  postButton.insertAdjacentElement("afterend", errorMsg);
};

const sendNewPost = (formData) => {
  // Include the CSRF token in your AJAX request
  const csrftoken = getCookie("csrftoken");
  fetch(`/api/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken, // Include the CSRF token in the headers
    },
    body: JSON.stringify({
      content: formData.content.value,
    }),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        return response.json().then((errorData) => {
          throw new Error(errorData.error);
        });
      }
    })
    .then((result) => {
      AllPostsPage("all-posts");
    })
    .catch((error) => {
      ErrorMsg(error);
    });
};

const NewPostForm = () => {
  const newPostForm = document.createElement("form");
  newPostForm.id = "new-post-form";

  newPostForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendNewPost(event.target);
  });

  const newPostLabel = document.createElement("label");
  newPostLabel.textContent = "New Post";

  const newPostTextarea = document.createElement("textarea");
  newPostTextarea.setAttribute("name", "content");
  newPostTextarea.className = "post-content";

  const newPostSubmitInput = document.createElement("input");
  newPostSubmitInput.setAttribute("value", "Post");
  newPostSubmitInput.setAttribute("type", "submit");
  newPostSubmitInput.className = "btn btn-primary button";
  newPostSubmitInput.id = "new-post-button";

  newPostForm.append(newPostLabel, newPostTextarea, newPostSubmitInput);

  document.querySelector(".main-page").append(newPostForm);
};

const AllPostsPage = (page) => {
  const heading = document.createElement("h1");
  heading.textContent = `${page.replace("-", " ").charAt(0).toUpperCase()}${page
    .replace("-", " ")
    .slice(1)}`;

  document.querySelector(".main-page").innerHTML = "";
  document.querySelector(".main-page").append(heading);
  NewPostForm();
  fetchPosts(page);
};
