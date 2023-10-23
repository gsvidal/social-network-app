from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json
from django.core.exceptions import ObjectDoesNotExist  # Import the exception
from django.db.models import Q
from django.core.paginator import Paginator,EmptyPage



from .models import User, Post, Follow, Like

def is_user_authenticated(request):
    if request.user.is_authenticated:
        return JsonResponse({'is_authenticated': True, 'user_id': request.user.id})
    else:
        return JsonResponse({'is_authenticated': False})

def index(request):
    return render(request, "network/index.html")

@login_required
def new_post(request):
    if request.method == "POST":
        data = json.loads(request.body)
        if data.get("content").strip() == "":
            return JsonResponse({"error": "Post content must not be empty"}, status=400)
        
        post = Post(
            content = data.get("content"),
            poster = request.user
        )
        post.save()

        return JsonResponse({"message": "Post created successfully."}, status=201)


def posts(request, page, poster_id):
    page_number = request.GET.get('page', 1)
    posts_per_page = 10

    if page == "all-posts":
        posts = Post.objects.all().order_by('-date')

    if request.user.is_authenticated:
        if page == "following":
            try:
                follows = Follow.objects.filter(follower=request.user)
                following_ids = []
                for follow in follows:
                    following_ids.append(follow.followed.id)

                # Create a Q object to combine the conditions
                q = Q(pk__in=following_ids)
                following_users = User.objects.filter(q)
                # Retrieve all the posts from the following_users
                posts = Post.objects.filter(poster__in=following_users)

            except ObjectDoesNotExist:
                posts = []
            
        elif page == "profile-page":
            try:
                posts = User.objects.get(pk=poster_id).posts.order_by('-date')
            except:
                return render(request, '404.html')
        elif page != "all-posts": 
            return JsonResponse({'error': "The page you're looking for, doesn't exist"}, status=404)
    
    paginator = Paginator(posts, posts_per_page)

    try:
        page_posts = paginator.page(page_number)
    except EmptyPage:
        page_posts = paginator.page(1)  # Handle out-of-range pages by returning the first page

    total_pages = paginator.num_pages

    post_data = []
    for post in page_posts:
        likes = post.likes.count()  # Count the number of likes for each post
        is_post_liked = False
        if request.user.is_authenticated:
            is_post_liked = Like.objects.filter(liker=request.user, post=post).count() > 0
        post_data.append({ 
            "id": post.id,
            "content": post.content,
            "date": post.date,
            "poster": post.poster.username,  # Get the username of the poster
            "poster_id": post.poster.id,
            "is_liked_by_auth_user": is_post_liked,
            "likes": likes,  # Include the number of likes
            "is_user_own_post": post.poster == request.user
        })
    
    posts_info = {"posts": post_data, "total_pages": total_pages,
            'has_previous': page_posts.has_previous(),
            'has_next': page_posts.has_next()}
    
    return JsonResponse({'posts_info': posts_info}, status=200)
     
def profile_page(request, poster_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            action = data.get("action")

            follower = request.user
            followed = User.objects.get(pk=poster_id)
            
            if action == "follow":
                follow = Follow(followed=followed, follower=follower)
                follow.save()
                is_following = True

            elif action == "unfollow":
                follow_to_delete = Follow.objects.get(followed=followed, follower=follower)
                if follow_to_delete is not None:
                    follow_to_delete.delete()
                    is_following = False
                else:
                    return JsonResponse({"error": "Couldn't unfollow this user, try again"}, status=400)

        except:
            return JsonResponse({"error": "Couldn't follow this user, try again"}, status=400)
        
    try:
        profile_user = User.objects.get(pk=poster_id)
    except User.DoesNotExist:
        return JsonResponse({'error': "The profile of this user doesn't exist"}, status=404)

    profile_user = User.objects.get(pk=poster_id)
    followers = profile_user.followers.count()
    followings = profile_user.following.count()
    auth_user_is_poster = profile_user == request.user

      # Check if the user is authenticated
    if request.user.is_authenticated:
        follower = request.user
        followed = profile_user

        try:
            follow = Follow.objects.get(followed=followed, follower=follower)
            is_following = True
        except Follow.DoesNotExist:
            is_following = False
    else:
        is_following = False

    user_posts_count = profile_user.posts.count()

    user_avatar = User.objects.get(pk=request.user.id)
    if user_avatar.avatar:
        avatar_url = user_avatar.avatar.url
        has_avatar = True
        print(f"avtar_url: {avatar_url}")
    else:
        has_avatar = False
        avatar_url = ""

    profile_data = {
        'username': profile_user.username,
        'posts_count': user_posts_count,
        'followers': followers, 
        'followings': followings, 
        'auth_user_is_poster': auth_user_is_poster, 
        'is_following': is_following,
        'is_user_auth': request.user.is_authenticated,
        'has_avatar': has_avatar,
        'avatar_url': avatar_url
        }

    return JsonResponse({'profile_data': profile_data}, status=200)

@login_required
def edit_post(request, post_id):
    if request.method == "PUT":
        data = json.loads(request.body)
        if data.get("new_content").strip() == "":
            return JsonResponse({"error": "Post content must not be empty"}, status=400)
        
        post_to_edit = Post.objects.get(pk=post_id)
        post_to_edit.content = data.get("new_content")
        post_to_edit.save()
        return JsonResponse({"message": "Post edited successfully."}, status=200)
    

@login_required
def like_post(request, post_id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            post_to_like = Post.objects.get(pk=post_id)
            if data.get("action") == "like":
                like = Like(liker=request.user, post=post_to_like)
                like.save()
            if data.get("action") == "unlike":
                like_to_delete = Like.objects.get(liker=request.user, post=post_to_like)
                like_to_delete.delete()
            return JsonResponse({"post_likes": post_to_like.likes.count()}, status=200)
        except:
            return JsonResponse({"error": "Couldn't like this post, try again"}, status=400)
            

@login_required
def delete_post(request, post_id):
    if request.method == "DELETE":
        try:
            post_to_delete = Post.objects.get(pk=post_id)
            post_to_delete.delete()
            return JsonResponse({"message": "Post deleted successfully."}, status=200)
        except:
            return JsonResponse({"error": "Couldn't delete this post, try again"}, status=400)
        
@login_required
def upload_avatar(request):
    if request.method == 'POST':
        avatar = request.FILES.get('avatar')
        if avatar:
            user = request.user
            try:
                user_avatar = User.objects.get(pk=user.id)
                user_avatar.avatar = avatar
                user_avatar.save()
                avatar_url = user_avatar.avatar.url  # Get the URL of the uploaded image
                print(f"avatar url: {avatar_url}")
                return JsonResponse({'message': 'Avatar uploaded successfully', 'avatar_url': avatar_url})
            except ObjectDoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=400)
        else:
            return JsonResponse({'error': 'No avatar file provided'}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)


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
