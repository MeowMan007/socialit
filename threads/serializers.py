from rest_framework import serializers
from .models import Thread

class ThreadSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True, min_value=-90, max_value=90)
    longitude = serializers.FloatField(write_only=True, min_value=-180, max_value=180)

    class Meta:
        model = Thread
        fields = ("id", "title", "body", "place_id", "city", "latitude", "longitude", "score", "comment_count", "created_at")
        read_only_fields = ("id", "score", "comment_count", "created_at")

    def create(self, validated_data):
        from django.contrib.gis.geos import Point
        latitude = validated_data.pop("latitude")
        longitude = validated_data.pop("longitude")
        return Thread.objects.create(position=Point(longitude, latitude, srid=4326), **validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.position:
            data["latitude"] = instance.position.y
            data["longitude"] = instance.position.x
        else:
            data["latitude"] = None
            data["longitude"] = None
        return data
