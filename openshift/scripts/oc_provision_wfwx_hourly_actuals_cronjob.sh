#!/bin/sh -l
#
source "$(dirname ${0})/common/common"

#%
#% OpenShift Deploy Helper
#%
#%   Intended for use with a pull request-based pipeline.
#%   Suffixes incl.: pr-###.
#%
#% Usage:
#%
#%    ${THIS_FILE} [SUFFIX] [apply]
#%
#% Examples:
#%
#%   Provide a PR number. Defaults to a dry-run.
#%   ${THIS_FILE} pr-0
#%
#%   Apply when satisfied.
#%   ${THIS_FILE} pr-0 apply
#%

# Target project override for Dev or Prod deployments
#
PROJ_TARGET="${PROJ_TARGET:-${PROJ_DEV}}"

# Use a random time if schedule not specified. (The BCWS server can't handle multiple identical requests at
# the same time, it will throw a duplicate object exception.)
SCHEDULE="${SCHEDULE:-$((16 + $RANDOM % 43)) * * * *}"

# Process template
OC_PROCESS="oc -n ${PROJ_TARGET} process -f ${TEMPLATE_PATH}/wfwx_hourly_actuals.cronjob.yaml \
-p JOB_NAME=wfwx-hourly-actuals-${APP_NAME}-${SUFFIX} \
-p NAME=${APP_NAME}-api \
-p APP_LABEL=${APP_NAME}-${SUFFIX} \
-p SUFFIX=${SUFFIX} \
-p SCHEDULE=\"${SCHEDULE}\" \
-p POSTGRES_DATABASE=${POSTGRES_DATABASE:-${APP_NAME}} \
-p POSTGRES_USER=wps-crunchydb-${SUFFIX} \
-p POSTGRES_WRITE_HOST=wps-crunchydb-${SUFFIX}-primary \
-p POSTGRES_READ_HOST=wps-crunchydb-${SUFFIX}-primary \
-p CRUNCHYDB_USER=wps-crunchydb-${SUFFIX}-pguser-wps-crunchydb-${SUFFIX} \
${PROJ_TOOLS:+ "-p PROJ_TOOLS=${PROJ_TOOLS}"} \
${IMAGE_REGISTRY:+ "-p IMAGE_REGISTRY=${IMAGE_REGISTRY}"}"

# Apply template (apply or use --dry-run)
#
OC_APPLY="oc -n ${PROJ_TARGET} apply -f -"
[ "${APPLY}" ] || OC_APPLY="${OC_APPLY} --dry-run=client"

# Execute commands
#
eval "${OC_PROCESS}"
eval "${OC_PROCESS} | ${OC_APPLY}"

# Provide oc command instruction
#
display_helper "${OC_PROCESS} | ${OC_APPLY}"
