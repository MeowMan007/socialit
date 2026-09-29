from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D, Distance
from django.db.models import F
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Thread
from .serializers import ThreadSerializer

class ThreadListCreateView(generics.ListCreateAPIView):
    serializer_class = ThreadSerializer
    queryset = Thread.objects.all().order_by("-created_at")
    def get_queryset(self):
        try:
            limit = int(self.request.query_params.get("limit", 25))
        except ValueError:
            raise ValidationError({"limit": "Must be an integer"})
        if not 1 <= limit <= 100:
            raise ValidationError({"limit": "Must be between 1 and 100"})
        return self.queryset[:limit]

class NearbyThreadsView(APIView):
    def get(self, request):
        try:
            latitude, longitude = float(request.query_params["lat"]), float(request.query_params["lng"])
            radius = int(request.query_params.get("radius_m", 5000))
        except (KeyError, ValueError):
            raise ValidationError("lat and lng are required numeric coordinates")
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180 or not 100 <= radius <= 50000:
            raise ValidationError("coordinates or radius_m are out of range")
        origin = Point(longitude, latitude, srid=4326)
        items = Thread.objects.filter(position__distance_lte=(origin, D(m=radius))).annotate(
            popularity=F("score") + F("comment_count"), distance=Distance("position", origin)
        ).order_by("-popularity")[:100]
        serializer = ThreadSerializer(items, many=True)
        data = serializer.data
        for row, thread in zip(data, items):
            row["distance_m"] = thread.distance.m
        return Response({"items": data, "next": None})
