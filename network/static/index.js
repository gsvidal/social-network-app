const isUserAuth = async () => {
  const response = await fetch("/api/auth");
  const { is_authenticated, user_id } = await response.json();
  return { is_authenticated, user_id };
};

let currentPage = 1;

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
    console.log("following");
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
      ProfilePage(profile_data, posterId);
    })
    .catch((error) => console.log(error));
};

const sendFollowing = (action, posterId) => {
  console.log(action, posterId);
  const csrftoken = getCookie("csrftoken");

  fetch(`/api/profile/${posterId}`, {
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
    .then(({ profile_data }) => {
      document.querySelector(".profile-page").innerHTML = "";
      ProfilePage(profile_data, posterId);
    })

    .catch((error) => console.log(error));
};

const ProfilePage = (profile_data, posterId) => {
  document.querySelector(".main-page").style.display = "none";
  document.querySelector(".profile-page").style.display = "block";

  const userDataContainer = document.createElement("section");
  userDataContainer.className = "user-data-container";

  const userAvatarImg = document.createElement("img");
  userAvatarImg.className = "user-avatar-img";
  userAvatarImg.setAttribute(
    "src",
    profile_data.has_avatar
      ? profile_data.avatar_url
      : "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
  );
  userAvatarImg.setAttribute("width", "100");
  userAvatarImg.setAttribute("height", "100");
  userAvatarImg.setAttribute("alt", "User Avatar");

  userDataContainer.append(userAvatarImg);

  if (profile_data.auth_user_is_poster) {
    const uploadAvatarInput = document.createElement("input");
    uploadAvatarInput.setAttribute("type", "file");
    uploadAvatarInput.setAttribute("id", "avatar");
    uploadAvatarInput.setAttribute("name", "avatar");
    uploadAvatarInput.setAttribute("accept", "image/*");
    uploadAvatarInput.className = "input--avatar";

    const uploadLabel = document.createElement("label");
    uploadLabel.setAttribute("for", "avatar");
    uploadLabel.className = "label--avatar";

    const uploadText = document.createElement("span");
    uploadText.textContent = "edit";
    uploadText.className = "label-text--avatar";

    const uploadIcon = document.createElement("span");
    uploadIcon.className = "icon--edit-avatar";

    uploadLabel.append(uploadIcon, uploadText);

    // Add an event listener to the file input
    uploadAvatarInput.addEventListener("change", handleFileSelect);

    // Function to handle the file selection
    function handleFileSelect(event) {
      const selectedFile = event.target.files[0];

      if (selectedFile) {
        // Check if the selected file is an image
        if (selectedFile.type.startsWith("image/")) {
          // Check if the file size is within the allowed limit (5MB)
          if (selectedFile.size <= 5 * 1024 * 1024) {
            const reader = new FileReader();

            reader.onload = function (e) {
              // Set the src attribute of the avatar image to the data URL of the selected image
              uploadAvatar(userAvatarImg, selectedFile);
            };

            // Read the selected image as a data URL
            reader.readAsDataURL(selectedFile);
          } else {
            alert("Please select an image file that is 5MB or smaller.");
            // Clear the file input to allow selecting a different file
            uploadAvatarInput.value = "";
          }
        } else {
          alert("Please select an image file.");
          // Clear the file input to allow selecting a different file
          uploadAvatarInput.value = "";
        }
      }
    }

    userDataContainer.append(uploadAvatarInput, uploadLabel);
  }

  function uploadAvatar(element, file) {
    const csrftoken = getCookie("csrftoken");

    const formData = new FormData();
    formData.append("avatar", file);
    console.log(formData);

    fetch("/api/upload_avatar", {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken, // Include the CSRF token in the headers
      },
      body: formData,
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

      .then(({ avatar_url }) => {
        console.log(avatar_url);
        const userAvatarImg = document.querySelector(".user-avatar-img");
        userAvatarImg.src = avatar_url;
      })
      .catch((error) => {
        console.log(error.message);
        ErrorMsg(
          element.parentElement,
          error.message === "Failed to fetch"
            ? "Couldn't upload the image. Try again."
            : error.message
        );
      });
  }

  const userMainData = document.createElement("div");
  userMainData.className = "user-data user-data--main";

  const username = document.createElement("p");
  username.className = "user-data-item";
  username.innerHTML = `<strong>${profile_data.username}</strong>`;

  if (!profile_data.auth_user_is_poster) {
    const followButton = document.createElement("button");
    followButton.className = `btn button--profile ${
      profile_data.is_following ? "btn-outline-info" : "btn-info"
    }`;
    followButton.textContent = profile_data.is_following
      ? "Unfollow"
      : "Follow";

    followButton.addEventListener("click", () => {
      const action = !profile_data.is_following ? "follow" : "unfollow";
      if (profile_data.is_user_auth) {
        sendFollowing(action, posterId);
      } else {
        window.location.href = "/login";
      }
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
  followers.className = "user-data-item user-data--followers";
  followers.innerHTML = `<strong>${profile_data.followers}</strong> followers`;

  const followings = document.createElement("p");
  followings.className = "user-data-item";
  followings.innerHTML = `<strong>${profile_data.followings}</strong> following`;

  userFollowData.append(postCount, followers, followings);

  userDataContainer.append(userMainData, userFollowData);

  document.querySelector(".profile-page").append(userDataContainer);
  const postsContainer = document.createElement("section");
  document.querySelector(".profile-page").append(postsContainer);
  fetchPosts("profile-page", postsContainer, currentPage, posterId);
};

const saveEditPost = (content, postId, editButtonItem) => {
  const csrftoken = getCookie("csrftoken");
  fetch(`/api/edit_post/${postId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrftoken, // Include the CSRF token in the headers
    },
    body: JSON.stringify({
      new_content: content,
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
    .then(() => {
      editButtonItem.textContent = "Edit post";
      editButtonItem.classList.remove("to-save");

      const postContent = document.createElement("p");
      postContent.className = "post-item-content";
      postContent.textContent = content;
      editButtonItem.parentElement.nextElementSibling.remove();
      editButtonItem.parentElement.insertAdjacentElement(
        "afterend",
        postContent
      );
    })
    .catch((error) => {
      ErrorMsg(editButtonItem.parentElement, error);
    });
};

const sendLiking = (likeIcon, action, postId) => {
  const csrftoken = getCookie("csrftoken");

  fetch(`/api/like_post/${postId}`, {
    method: "PUT",
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
    .then(({ post_likes }) => {
      likeIcon.nextElementSibling.textContent = post_likes;
      if (action === "like") {
        likeIcon.classList.add("liked");
      }
      if (action === "unlike") {
        likeIcon.classList.remove("liked");
        likeIcon.classList.add("broken");
        setTimeout(() => {
          likeIcon.classList.remove("broken");
        }, 500);
      }
    })
    .catch((error) => {
      ErrorMsg(likeIcon, error);
    });
};

const postItem = (post, postsContainer) => {
  const postContainer = document.createElement("div");
  postContainer.className = "post-container";

  const poster = document.createElement("span");
  poster.textContent = post.poster;
  poster.className = "poster";
  poster.addEventListener("click", () => {
    document.querySelector(".main-page").innerHTML = "";
    document.querySelector(".profile-page").innerHTML = "";
    fetchProfileData(post.poster_id);
  });

  postContainer.append(poster);

  if (post.is_user_own_post) {
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "buttons-container";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit post";
    editButton.className = "btn btn-outline-info button button--edit";

    let newContent = "";
    editButton.addEventListener("click", (event) => {
      const editButtonItem = event.target;
      if (editButtonItem.classList.contains("to-save")) {
        saveEditPost(newContent, post.id, event.target);
      } else {
        editButtonItem.classList.add("to-save");
        editButtonItem.textContent = "Save post";

        const postContentToEdit = document.createElement("textarea");

        postContentToEdit.className = "post-content post-content--edit";
        console.log(
          editButtonItem.parentElement.nextElementSibling.textContent
        );
        postContentToEdit.textContent =
          editButtonItem.parentElement.nextElementSibling.textContent;

        postContentToEdit.addEventListener("input", (event) => {
          newContent = event.target.value;
        });

        editButtonItem.parentElement.nextElementSibling.remove();
        editButton.parentElement.insertAdjacentElement(
          "afterend",
          postContentToEdit
        );
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete post";
    deleteButton.className = "btn btn-outline-danger button button--delete";

    const deletePost = (element, postId) => {
      const csrftoken = getCookie("csrftoken");

      fetch(`/api/delete_post/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken, // Include the CSRF token in the headers
        },
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
        .then(() => {
          const postItem = element.parentElement.parentElement;
          postItem.classList.add("post-deleted");
          setTimeout(() => {
            postItem.remove();
          }, 1500);
        })
        .catch((error) => {
          ErrorMsg(element, error);
        });
    };

    deleteButton.addEventListener("click", () => {
      deletePost(deleteButton, post.id);
    });

    buttonsContainer.append(editButton, deleteButton);
    postContainer.append(buttonsContainer);
  }

  const postContent = document.createElement("p");
  postContent.className = "post-item-content";

  postContent.textContent = post.content;

  const postDate = document.createElement("p");
  postDate.className = "post-date";
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
  likeIcon.className = `like-icon ${post.is_liked_by_auth_user ? "liked" : ""}`;

  likeIcon.addEventListener("click", async () => {
    const { is_authenticated } = await isUserAuth();
    if (is_authenticated) {
      if (!likeIcon.classList.contains("liked")) {
        sendLiking(likeIcon, "like", post.id);
      } else {
        sendLiking(likeIcon, "unlike", post.id);
      }
    } else {
      window.location.href = "/login";
    }
  });

  const likeCounter = document.createElement("span");
  likeCounter.textContent = post.likes;

  likeContainer.append(likeIcon, likeCounter);

  postContainer.append(postContent, postDate, likeContainer);

  postsContainer.append(postContainer);
};

const PaginationButtons = (postsContainer) => {
  const paginationButtons = document.createElement("div");
  paginationButtons.className = "button-pagination-container";

  const previousButton = document.createElement("button");
  previousButton.className =
    "btn btn-info button-pagination button-pagination--previous";

  const previousPaginationIcon = document.createElement("span");
  previousPaginationIcon.className =
    "pagination-icon pagination--icon--previous";

  previousButton.append(previousPaginationIcon);
  previousButton.append("Prev");

  const pageInfo = document.createElement("span");
  pageInfo.className = "page-info";

  const nextButton = document.createElement("button");
  nextButton.className =
    "btn btn-info button-pagination button-pagination--next";

  const nextPaginationIcon = document.createElement("span");
  nextPaginationIcon.className = "pagination-icon pagination-icon--next";

  nextButton.append("Next");
  nextButton.append(nextPaginationIcon);

  paginationButtons.append(previousButton, pageInfo, nextButton);

  postsContainer.insertAdjacentElement("afterbegin", paginationButtons);

  return { previousButton, pageInfo, nextButton };
};

const fetchPosts = (page, postsContainer, pageNumber, posterId = 0) => {
  fetch(`/api/posts/${page}/${posterId}?page=${pageNumber}`)
    .then((response) => response.json())
    .then(({ posts_info }) => {
      if (posts_info.posts.length > 0) {
        postsContainer.innerHTML = "";
        posts_info.posts.forEach((post) => postItem(post, postsContainer));
        const { previousButton, pageInfo, nextButton } =
          PaginationButtons(postsContainer);
        currentPage = pageNumber;
        previousButton.disabled = !posts_info.has_previous;
        nextButton.disabled = !posts_info.has_next;

        pageInfo.innerHTML = `Page <strong>${pageNumber}</strong> of ${posts_info.total_pages}`;

        // Event listeners for pagination controls
        previousButton.addEventListener("click", () => {
          if (currentPage > 1) {
            fetchPosts(page, postsContainer, currentPage - 1, posterId);
          }
        });

        nextButton.addEventListener("click", () => {
          if (currentPage < posts_info.total_pages) {
            fetchPosts(page, postsContainer, currentPage + 1, posterId);
          }
        });
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

const ErrorMsg = (element, error) => {
  // const postButton = document.querySelector("#new-post-button");
  const errorMsg = document.createElement("p");
  errorMsg.textContent = error;
  errorMsg.className = "error-msg";

  element.insertAdjacentElement("afterend", errorMsg);
  setTimeout(() => {
    errorMsg.remove();
  }, 2000);
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
      ErrorMsg(formData, error);
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
  newPostTextarea.setAttribute("placeholder", "Share your thoughts here...");
  newPostTextarea.className = "post-content";

  const newPostSubmitInput = document.createElement("input");
  newPostSubmitInput.setAttribute("value", "Post");
  newPostSubmitInput.setAttribute("type", "submit");
  newPostSubmitInput.className = "btn btn-info button button--post";
  newPostSubmitInput.id = "new-post-button";

  newPostForm.append(newPostLabel, newPostTextarea, newPostSubmitInput);

  document.querySelector(".main-page")?.append(newPostForm);
};

const MainPage = async (page) => {
  const mainPageElement = document.querySelector(".main-page");
  const profilePageElement = document.querySelector(".profile-page");

  if (mainPageElement) {
    mainPageElement.style.display = "block";
    profilePageElement.style.display = "none";
  }

  const heading = document.createElement("h1");
  heading.textContent = `${page.replace("-", " ").charAt(0).toUpperCase()}${page
    .replace("-", " ")
    .slice(1)}`;

  if (mainPageElement) {
    mainPageElement.innerHTML = "";
    mainPageElement.append(heading);
  }

  const { is_authenticated } = await isUserAuth();
  if (is_authenticated && page === "all-posts") {
    NewPostForm();
  }
  const postsContainer = document.createElement("section");
  mainPageElement?.append(postsContainer);

  fetchPosts(page, postsContainer, currentPage);
};
