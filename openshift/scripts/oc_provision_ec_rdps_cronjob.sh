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

# Specify a default schedule to run every 2 hours, since one run of the cronjob
# can sometimes take over an hour
SCHEDULE="${SCHEDULE:-$((24 + $RANDOM % 35)) */2 * * *}"

# Process template
OC_PROCESS="oc -n ${PROJ_TARGET} process -f ${TEMPLATE_PATH}/env_canada_rdps.cronjob.yaml \
-p JOB_NAME=env-canada-rdps-${APP_NAME}-${SUFFIX} \
-p APP_LABEL=${APP_NAME}-${SUFFIX} \
-p NAME=${APP_NAME} \
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
[ "${APPLY}" ] || OC_APPLY="${OC_APPLY} --dry-run"

# Execute commands
#
eval "${OC_PROCESS}"
eval "${OC_PROCESS} | ${OC_APPLY}"

# Provide oc command instruction
#
display_helper "${OC_PROCESS} | ${OC_APPLY}"
