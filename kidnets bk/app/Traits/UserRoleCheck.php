<?php

namespace App\Traits;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

trait UserRoleCheck
{
    /**
     * Check the user's role and optionally validate their permissions.
     *
     * @param string|array|null $permissions Permission(s) to check (optional).
     * @return int|JsonResponse|null
     */
    protected function checkUserRole(string|array|null $permissions = null)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        Log::info("Checking User Role", [
            'user_id' => $user->id,
            'role' => $user->role,
            'team_id' => $user->doctor_id ?? $user->id
        ]);

        // Optional permission check: Allow access if the user has at least one required permission
        if ($permissions) {
            if (!$this->hasAnyPermission($user, (array) $permissions)) {
                Log::warning("Permission Denied", [
                    'user_id' => $user->id,
                    'required_permissions' => $permissions,
                    'user_permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                    'roles' => $user->roles->pluck('name')->toArray()
                ]);
                return response()->json(['error' => 'Forbidden: Missing Required Permissions'], Response::HTTP_FORBIDDEN);
            }
        }

        // Determine doctor ID based on role
        return $user->role === 'nurse' ? $user->doctor_id : $user->id;
    }

    /**
     * Check if the user has at least one of the given permissions.
     *
     * @param object $user Authenticated user instance.
     * @param array $permissions List of required permissions.
     * @return bool
     */
    protected function hasAnyPermission($user, array $permissions): bool
    {
        $teamId = $user->doctor_id ?? $user->id;
        setPermissionsTeamId($teamId);



        // ✅ Allow access if the user has at least one required permission
        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                Log::info("✅ Permission Granted", [
                    'user_id' => $user->id,
                    'granted_permission' => $permission
                ]);
                return true;
            }
        }

        return false;
    }
}
