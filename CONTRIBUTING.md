# CONTRIBUTION PROCESS
To contribute to this repository, please create a branch on your local
clone, push that branch to the repository, and create a Pull Request (PR)
for that branch. No commits can be directly added onto `master` - all
must come via a Pull Request.

### Reviewers
All PRs must be approved by at least 2 reviewers before they can be merged.
Any team members can act as reviewers, but it is suggested that in general
each PR should have one reviewer from the 'software development' angle, and
one reviewer from the 'data science' angle. All team members (dependent on
their notifications settings) will be notified of new PRs, and are encouraged
to provide additional review comments whenever they can.

### Work items
Please link each PR to the ID number of a work item from the current sprint. If no work items
are linked, the PR cannot be merged - a new work item should be raised in
order to facilitate capturing the work being done. The proposed format for naming branches is <ticket_id>-work_description, i.e. 29973-docker-configuration.


If you reference a work item by ID in a commit message - e.g. "#12345
Fixed issue where data was eaten by a grue" - DevOps will auto link the item
to the commit, and therefore to the pull request. 

Otherwise you can manually link items at the point of PR creation, or
afterwards, if necessary.

### Formatting
Please adhere to PEP8 (https://www.python.org/dev/peps/pep-0008/), the
Python Style Guide. In particular, please

1) Indent with 4 spaces (not tabs).
1) Place 2 blank lines between top-level function and class definitions.
1) Place 1 blank line around method definitions within a class.
1) Place import statements at the top of the file, after any module comments
and docstrings.
1) Include a docstring for each function unless the function is extremely
trivial - if in doubt, err on the side of more documentation. See
https://www.python.org/dev/peps/pep-0257/ for full guidance on writing docstrings.
Note the use of triple-double quotes (""") to start and end docstrings.
1) The command line tool "black" can be used to format scripts properly. See https://pypi.org/project/black/ for download details.

### Testing
All PRs should also contain tests that test the functionality within
the PR. If writing pure Python code, pytest. If Django code, then Django's testing library. If .NET, then xunit.

### Continuous integration
In the near future, Continuous Integration tests will run on each PR, to
ensure that all tests pass before the PR can be merged into `master`.
More details will be available when this is in place.
