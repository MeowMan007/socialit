from django.urls import path
from .views import NearbyThreadsView, ThreadListCreateView

urlpatterns = [
    path("threads", ThreadListCreateView.as_view(), name="threads"),
    path("nearby/threads", NearbyThreadsView.as_view(), name="nearby-threads"),
]
