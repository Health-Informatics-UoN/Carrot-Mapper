from django.core.management.base import BaseCommand, CommandError
from mapping.services_synthetic_data import generate_synthetic_data_report


class Command(BaseCommand):
    help = 'create rules from exisiting concepts found for a given table id'
    def add_arguments(self, parser):
        parser.add_argument('--id', required=True, type=int)
        parser.add_argument('--number-of-events', required=True, type=int)
        parser.add_argument('-o','--output-folder',default='',type=str)
                            
    def handle(self, *args, **options):
        request = None
        _id = options['id']
        number_of_events = options['number_of_events']
        output_folder = options['output_folder']
        
        generate_synthetic_data_report(scan_report_id=_id,
                                       number_of_events=number_of_events,
                                       output_folder=output_folder)
        
