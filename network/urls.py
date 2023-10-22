
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes:
    path("api/posts/<str:page>/<int:poster_id>", views.posts, name="posts"),
    path("api/posts", views.new_post, name="new_post"),
    path("api/auth", views.is_user_authenticated, name="is_user_authenticated"),
    path("api/profile/<int:poster_id>", views.profile_page, name="profile_page"),
    path("api/edit_post/<int:post_id>", views.edit_post, name="edit_post"),
    path("api/like_post/<int:post_id>", views.like_post, name="like_post"),
    path("api/delete_post/<int:post_id>", views.delete_post, name="delete_post")
]
