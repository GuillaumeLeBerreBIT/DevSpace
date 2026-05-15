from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer


class MeView(RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    # Instead of looking up a pk from the URL, always return the logged-in user.
    def get_object(self):
        return self.request.user
