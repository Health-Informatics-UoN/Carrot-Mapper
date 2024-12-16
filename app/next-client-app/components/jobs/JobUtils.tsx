export const FindGeneralStatus = (jobsData: Job[]) => {
  let generalStatus = "NOT_STARTED";
  if (jobsData.length > 0) {
    if (
      jobsData?.some((job) => job.status && job.status.value === "IN_PROGRESS")
    ) {
      generalStatus = "IN_PROGRESS";
    } else if (
      jobsData?.some((job) => job.status && job.status.value === "FAILED")
    ) {
      generalStatus = "FAILED";
    } else if (
      jobsData?.every((job) => job.status && job.status.value === "COMPLETE")
    ) {
      generalStatus = "COMPLETE";
    }
  }
  return generalStatus;
};

export const DivideJobs = (jobsData: Job[]) => {
  let jobGroups: Job[][] = [];
  // Divide the jobs of each table to group of three (each group demonstrates each run)
  if (jobsData.length > 0) {
    let jobs: Job[] = [];
    jobsData.forEach((job) => {
      jobs.push(job);
      if (jobs.length === 3) {
        // Sort jobs based on the "created_at" field
        jobs.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        jobGroups.push(jobs);
        jobs = [];
      }
    });
  }
  return jobGroups;
};
