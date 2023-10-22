from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone



class User(AbstractUser):
    id = models.AutoField(primary_key=True)
    pass


# Post
class Post(models.Model):
    id = models.AutoField(primary_key=True)
    content = models.CharField(max_length=400)
    date = models.DateTimeField(default=timezone.now)
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    
# Like
class Like(models.Model):
    id = models.AutoField(primary_key=True)
    liker = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")

# Follower
class Follow(models.Model):
    id = models.AutoField(primary_key=True)
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')