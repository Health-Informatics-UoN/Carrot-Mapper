class OmopRouter:
    """
    A router to control all database operations on models in the
    Omop database
    """
    #we have two seperate database objects, which we can separate:
    # - api/mapping
    #   - where we have ScanReport Objects eg. ScanReportValue
    # - api/data
    #   - where we have Omop Objects e.g. Concept

    #define a look up between the "data" api models
    #and the omop database which is defined in
    # settings.py under DATABASES = { 'omop': ... }
    route_app_labels = { 'data': 'omop' }

    #overload the function for where to read the database from
    def db_for_read(self, model, **hints):
        """
        Attempts to read data models go to omop db
        """
        #if the app label is in route_app_labels
        if model._meta.app_label in self.route_app_labels:
            #for which it will be for the data models (Concept, ConceptRelationShip...)
            #tell django to read from this database instead 
            return self.route_app_labels[model._meta.app_label]
        #otherwise None will handle as normal
        #i.e. to read from 'default' database that is defined in settings.py
        return None

