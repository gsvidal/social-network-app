from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import User, Post


def index(request):
    return render(request, "network/index.html")

@login_required
def new_post(request):
    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=405)
    
    data = json.loads(request.body)
    if data.get("content").strip() == "":
        return JsonResponse({"error": "Post content must not be empty"}, status=400)
    
    print(f"data sent from front: {data}")
    post = Post(
        content = data.get("content"),
        poster = request.user
    )
    post.save()

    return JsonResponse({"message": "Post created successfully."}, status=201)


def main_page(request, page):
     if page == "all-posts":
        posts = Post.objects.all().order_by('-date')
        post_data = []
        for post in posts:
            likes = post.like_set.count()  # Count the number of likes for each post
            post_data.append({
                "id": post.id,
                "content": post.content,
                "date": post.date,
                "poster": post.poster.username,  # Get the username of the poster
                "likes": likes,  # Include the number of likes
            })
        
        return JsonResponse({"posts": post_data}, status=201)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")
