import uuid
from django.contrib.gis.db import models

class Location(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    google_place_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=120, null=True, blank=True, db_index=True)
    boundary = models.MultiPolygonField(srid=4326, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "locations"

class Thread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    author_id = models.UUIDField(null=True, blank=True)
    location = models.ForeignKey(Location, null=True, blank=True, on_delete=models.SET_NULL, related_name="threads")
    title = models.CharField(max_length=300)
    body = models.TextField(blank=True)
    place_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    city = models.CharField(max_length=120, null=True, blank=True, db_index=True)
    position = models.PointField(srid=4326, geography=True, spatial_index=True, null=True, blank=True)
    score = models.IntegerField(default=0)
    comment_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "threads"
        ordering = ["-created_at"]
