const isUserAuth = async () => {
  const response = await fetch("/api/auth");
  const { is_authenticated, user_id } = await response.json();
  return { is_authenticated, user_id };
};

document.addEventListener("DOMContentLoaded", () => {
  MainPage("all-posts");

  const allPostsNavElement = document.querySelector("#all-posts-nav");
  const FollowingNavElement = document.querySelector("#following-nav");
  const usernameNavBar = document.querySelector("#nav-link-username");

  const checkUser = async () => {
    if (usernameNavBar) {
      const { user_id } = await isUserAuth();
      usernameNavBar.addEventListener("click", () => {
        document.querySelector(".profile-page").innerHTML = "";
        fetchProfileData(user_id);
      });
    }
  };
  checkUser();

  allPostsNavElement.addEventListener("click", () => {
    MainPage("all-posts");
  });
  
  FollowingNavElement?.addEventListener("click", () => {
    console.log("following")
    MainPage("following");
  });
});

const fetchProfileData = (posterId) => {
  fetch(`/api/profile/${posterId}`)
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(errorData.error);
        });
      } else {
        return response.json();
      }
    })
    .then(({ profile_data }) => {
      console.log(profile_data);
      ProfilePage(profile_data, posterId);
    })
    .catch((error) => console.log(error));
};

const sendFollowing = (action, posterId) => {
  console.log(action, posterId);
  const csrftoken = getCookie("csrftoken");

  fetch(`/api/following/${posterId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken, // Include the CSRF token in the headers
    },
    body: JSON.stringify({
      action: action,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((errorData) => {
          throw new Error(errorData.error);
        });
      } else {
        return response.json();
      }
    })
    .then(({ is_following }) => {
      const followButton = document.querySelector(".button--profile");
      followButton.textContent = is_following ? "Unfollow" : "Follow";
    })
    .then(() => {
      document.querySelector(".profile-page").innerHTML = "";
      fetchProfileData(posterId);
    })
    .catch((error) => console.log(error));
};

const followingUser = (action, posterId) => {
  sendFollowing(action, posterId);
};

const ProfilePage = (profile_data, posterId) => {
  console.log("is following: ", profile_data.is_following);
  document.querySelector(".main-page").style.display = "none";
  document.querySelector(".profile-page").style.display = "block";

  const userAvatar = document.createElement("img");
  userAvatar.className = "user-avatar";
  userAvatar.setAttribute("src", "");
  userAvatar.setAttribute("width", "100");
  userAvatar.setAttribute("height", "100");
  userAvatar.setAttribute("alt", "User Avatar");

  const userDataContainer = document.createElement("section");
  userDataContainer.className = "user-data-container";

  const userMainData = document.createElement("div");
  userMainData.className = "user-data user-data--main";

  const username = document.createElement("p");
  username.className = "user-data-item";
  username.innerHTML = `<strong>${profile_data.username}</strong>`;

  if (!profile_data.auth_user_is_poster) {
    const followButton = document.createElement("button");
    followButton.className = "btn btn-info button--profile";
    followButton.textContent = profile_data.is_following
      ? "Unfollow"
      : "Follow";

    followButton.addEventListener("click", () => {
      const action = !profile_data.is_following ? "follow" : "unfollow";
      followingUser(action, posterId);
    });

    userMainData.append(username, followButton);
  } else {
    userMainData.append(username);
  }

  const userFollowData = document.createElement("div");
  userFollowData.className = "user-data user-data--follow";

  const postCount = document.createElement("p");
  postCount.className = "user-data-item";
  postCount.innerHTML = `<strong>${profile_data.posts_count}</strong> posts`;

  const followers = document.createElement("p");
  followers.className = "user-data-item";
  followers.innerHTML = `<strong>${profile_data.followers}</strong> followers`;

  const followings = document.createElement("p");
  followings.className = "user-data-item";
  followings.innerHTML = `<strong>${profile_data.followings}</strong> following`;

  userFollowData.append(postCount, followers, followings);

  userDataContainer.append(userAvatar, userMainData, userFollowData);

  document.querySelector(".profile-page").append(userDataContainer);

  fetchPosts("profile-page", posterId);
};

const postItem = (post, page) => {
  const postContainer = document.createElement("div");
  postContainer.className = "post-container";

  const poster = document.createElement("span");
  poster.textContent = post.poster;
  poster.className = "poster";
  poster.addEventListener("click", () => {
    document.querySelector(".main-page").innerHTML = ""
    document.querySelector(".profile-page").innerHTML = ""
    fetchProfileData(post.poster_id);
  });

  const editButton = document.createElement("button");
  editButton.textContent = "Edit post";
  editButton.className = "btn btn-outline-info button button--edit";

  const postContent = document.createElement("p");
  postContent.textContent = post.content;

  const postDate = document.createElement("p");
  const postFormattedDate = new Date(post.date);

  const options = {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  postDate.textContent = postFormattedDate.toLocaleString(undefined, options);

  const likeContainer = document.createElement("div");
  likeContainer.className = "like-container";

  const likeIcon = document.createElement("span");
  likeIcon.className = "like-icon";

  likeIcon.addEventListener("click", () => {
    if (!likeIcon.classList.contains("liked")) {
      likeIcon.classList.add("liked");
    } else {
      likeIcon.classList.remove("liked");
      likeIcon.classList.add("broken");
      setTimeout(() => {
        likeIcon.classList.remove("broken");
      }, 500);
    }
  });

  const likeCounter = document.createElement("span");
  likeCounter.textContent = post.likes;

  likeContainer.append(likeIcon, likeCounter);

  postContainer.append(
    poster,
    editButton,
    postContent,
    postDate,
    likeContainer
  );

  document
    .querySelector(`${page !== "profile-page" ? ".main-page" : "." + page}`)
    ?.append(postContainer);
};

const fetchPosts = (page, posterId = 0) => {
  fetch(`/api/posts/${page}/${posterId}`)
    .then((response) => response.json())
    .then(({ posts }) => {
      if (posts.length > 0) {
        posts.forEach((post) => postItem(post, page));
      } else {
        const emptyPosts = (document.createElement("p").textContent =
          "No posts yet");
        document
          .querySelector(
            `${page !== "profile-page" ? ".main-page" : "." + page}`
          )
          ?.append(emptyPosts);
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
  errorMsg.className = "error-msg";

  postButton.insertAdjacentElement("afterend", errorMsg);
  setTimeout(() => {
    errorMsg.remove();
  }, 1500);
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
      MainPage("all-posts");
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
  newPostSubmitInput.className = "btn btn-info button";
  newPostSubmitInput.id = "new-post-button";

  newPostForm.append(newPostLabel, newPostTextarea, newPostSubmitInput);

  document.querySelector(".main-page")?.append(newPostForm);
};

const MainPage = async (page) => {
  document.querySelector(".main-page").style.display = "block";
  document.querySelector(".profile-page").style.display = "none";

  const heading = document.createElement("h1");
  heading.textContent = `${page.replace("-", " ").charAt(0).toUpperCase()}${page
    .replace("-", " ")
    .slice(1)}`;

  const mainPageElement = document.querySelector(".main-page");
  if (mainPageElement) {
    mainPageElement.innerHTML = "";
    mainPageElement.append(heading);
  }

  const { is_authenticated } = await isUserAuth();
  if (is_authenticated && page === "all-posts") {
    NewPostForm();
  }
  fetchPosts(page);
};
