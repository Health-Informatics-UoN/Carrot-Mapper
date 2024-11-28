from django.db import models
from shared.mapping.models import BaseModel


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
