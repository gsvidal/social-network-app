
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API Routes:
    path("api/posts/<str:page>", views.main_page, name="main_page"),
    path("api/posts", views.new_post, name="new_post"),
    path("api/auth", views.is_user_authenticated, name="is_user_authenticated"),
    # path("api/profile/<str:poster>", views.profile, name="profile"),
    
]
