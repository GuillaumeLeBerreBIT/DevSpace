from rest_framework.routers import DefaultRouter
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
# register(prefix, viewset, basename)
# prefix → the URL path segment: "projects" becomes /api/projects/
# basename → used internally by DRF to name the URL patterns (e.g. project-list, project-detail)
router.register(r'projects', views.ProjectViewSet, basename='project')
router.register(r'sprints', views.SprintViewSet, basename='sprint')
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'docs', views.DocPageViewSet, basename='doc')
router.register(r'devlog', views.DevLogEntryViewSet, basename='devlog')
router.register(r'snippets', views.SnippetViewSet, basename='snippet')
router.register(r'env-vars', views.EnvVariableViewSet, basename='envvar')

urlpatterns = [
    path('', include(router.urls)),
    path('search/', views.SearchView.as_view(), name='search'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('projects/<str:project_id>/unlock-vault/', views.VaultUnlockView.as_view(), name='vault-unlock'),
    path('projects/<str:project_id>/set-vault-password/', views.VaultSetPasswordView.as_view(), name='vault-set-password'),
    # JWT endpoints — POST /api/token/ returns access + refresh tokens
    # POST /api/token/refresh/ takes a refresh token and returns a new access token
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
