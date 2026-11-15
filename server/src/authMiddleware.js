
/**
 * Middleware for checking authenticated users and their roles.
 *
 * Authentication middleware must verify the user's identity
 * and populate request.user before these functions run.
 */

// Require a user to be authenticated.
export function requireAuth(request, response, next) {
  if (!request.user) {
    return response.status(401).json({
      error: 'Authentication required',
    })
  }

  next()
}

// Allow access only to users with an approved role.
export function requireRole(...allowedRoles) {
  return (request, response, next) => {
    if (!request.user) {
      return response.status(401).json({
        error: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(request.user.role)) {
      return response.status(403).json({
        error: 'Access denied',
      })
    }

    next()
  }
}
