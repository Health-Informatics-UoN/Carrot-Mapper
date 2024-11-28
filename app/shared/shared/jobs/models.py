from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.constraints import UniqueConstraint
from shared.data.models import Concept


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class JobStage(models.Model):
    value = models.CharField(max_length=64)
    display_name = models.CharField(max_length=64)


class StageStatus(models.Model):
    value = models.CharField(max_length=64)
    display_name = models.CharField(max_length=64)


class Job(BaseModel):
    scan_report_id = models.IntegerField(null=True)
    scan_report_table_id = models.IntegerField(null=True)
    stage = models.ForeignKey(
        "JobStage",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="job_stage",
    )
    status = models.ForeignKey(
        "StageStatus",
        null=True,
        blank=True,
        on_delete=models.DO_NOTHING,
        related_name="stage_status",
    )
    details = models.CharField(max_length=256, null=True, blank=True)
