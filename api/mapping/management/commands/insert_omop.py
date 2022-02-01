from django.core.management.base import BaseCommand
from mapping.models import OmopTable, OmopField
from coconnect.tools.omop_db_inspect import OMOPDetails


class Command(BaseCommand):
    help = "load or update the OmopTable/Fields from the OMOP postgres db"

    # def add_arguments(self, parser):
    #    parser.add_argument('poll_ids', nargs='+', type=int)

    def handle(self, *args, **options):

        # first delete all tables
        OmopTable.objects.all().delete()

        # get the omop cdm lookup
        df_omop = OMOPDetails().cdm

        # loop over all tables made available
        for table in df_omop.index.unique():
            # get all fields

            omop_table = OmopTable.objects.create(table=table)

            for field in df_omop.loc[table]["field"].tolist():
                omop_field = OmopField.objects.create(table=omop_table, field=field)
