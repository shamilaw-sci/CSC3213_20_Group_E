# Agent operations preservation extraction

Scope: move getAgentLeads, updateLeadMetadata and deleteLead to controllers/agent/agentCrmController.js; move getMyAppointments and cancelBuyerAppointment to controllers/agent/buyerAppointmentController.js. Retain agentController exports, all other imports/handlers and routes. Copy complete handlers/comments verbatim; only repository relative require changes. No booking/profile/dashboard/repository/DB/environment/dependency/git changes.

1. Snapshot the original facade and add mocked direct characterization of exact role denials, positional repository arguments, null/default values, false pre_approved, success/not-found/errors and buyer email/id scoping. Run on original source with Node 512 MB and Jest --runInBand.
2. Extract the five handlers and add explicit imports behind the same facade exports.
3. Run the same targeted tests and executable normalized whole-parent reconstruction/child exact-body proof. Parent runs aggregate acceptance and independent review. No real API or database calls.
