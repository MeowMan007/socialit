import uuid
from django.contrib.gis.db import models as gis_models
from django.contrib.postgres.operations import CreateExtension
from django.db import migrations, models
import django.contrib.gis.db.models.fields
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        CreateExtension("postgis"),
        migrations.CreateModel(name="Location", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("google_place_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
            ("name", models.CharField(max_length=255)),
            ("city", models.CharField(blank=True, db_index=True, max_length=120, null=True)),
            ("boundary", django.contrib.gis.db.models.fields.MultiPolygonField(blank=True, null=True, srid=4326)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
        ], options={"db_table": "locations"}),
        migrations.CreateModel(name="Thread", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("author_id", models.UUIDField(blank=True, null=True)),
            ("title", models.CharField(max_length=300)),
            ("body", models.TextField(blank=True)),
            ("place_id", models.CharField(blank=True, db_index=True, max_length=255, null=True)),
            ("city", models.CharField(blank=True, db_index=True, max_length=120, null=True)),
            ("position", django.contrib.gis.db.models.fields.PointField(blank=True, geography=True, null=True, spatial_index=True, srid=4326)),
            ("score", models.IntegerField(default=0)),
            ("comment_count", models.IntegerField(default=0)),
            ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
            ("location", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="threads", to="threads.location")),
        ], options={"db_table": "threads", "ordering": ["-created_at"]}),
    ]
