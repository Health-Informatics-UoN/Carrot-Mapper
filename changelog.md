# Changelog

Please append a line to the changelog for each change made.

## v1.1-beta
* Add ReactJS functionality for values view, including use of snowpack.
* All ScanReport API endpoints support filtering on return fields.
* Mapping rules generation and display vastly sped up.
* NVM used to install npm/Node rather than relying on system packages.
* ProcessQueue made more robust to errors, with more helpful outputs.
* API endpoints updates to return records for a list of ids in a table (This is done for tables like: structuralmappingrule, concept, omopfield,omoptable,scanreporttable,scanreportfield,scanreportvalue and scanreportconcept)
* Added REACT functionality for mapping rules table
* Added REACT functionality for tables page
* ProcessQueue reads in PAGE_MAX_CHARS from the environment to set the max number of chars in a POST request.
* Pages using REACT now includes Values,Fields,Tables,Mapping Rules,Edit Table,Edit Field, Scan Reports

## v1.0.0 was released 01/09/21
