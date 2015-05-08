#!/usr/bin/env Rscript  
setwd('<%=folder_path%>')   
options(device = function() png(width = 960))
local({
  r <- getOption("repos")
  r["CRAN"] <- "http://cran.cnr.berkeley.edu/"
  options(repos = r)
})
