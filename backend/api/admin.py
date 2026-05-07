from django.contrib import admin
from .models import Project, Sprint, Task, DocPage, DevLogEntry, Snippet

admin.site.register(Project)
admin.site.register(Sprint)
admin.site.register(Task)
admin.site.register(DocPage)
admin.site.register(DevLogEntry)
admin.site.register(Snippet)
