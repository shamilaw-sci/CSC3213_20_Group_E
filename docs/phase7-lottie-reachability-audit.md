# Lottie build-warning source audit —2026-11-04

Read-only follow-up while payment UI aggregate verification ran. No dependency,
asset, animation, build policy or runtime change was made by this audit.

Source search found rendered Player entry points in Login and AgentSearch using
fixed /images/login-animation.json and /images/agent-animation.json respectively.
Register imports Player but has no rendered Player use in the reviewed JSX.
No user/request-selected animation src was observed at these entry points.

Offline recursive JSON inspection of both local assets found0 string-valued x
fields and0 external HTTP/protocol-relative u/p asset references. These are
bounded structural observations, not a complete parser/animation security proof.
No animation or expression was executed and no remote asset was fetched.

The installed @lottiefiles/react-lottie-player bundle still contains a direct
eval that constructs a function from its expression value. That confirms the
build warning corresponds to existing dependency code. Static caller/asset
observations do not prove every dependency evaluation path unreachable, resolve
advisory reachability, establish CSP compatibility or make future animation
replacement safe. Existing large-chunk and Lottie direct-eval warnings remain
open assessment items; no warning was suppressed, dependency upgraded or arbitrary
new exception introduced.

This audit changes no prior backend/frontend test counts and is not deployed
browser/CSP/provider acceptance or a whole-phase vulnerability clearance.
