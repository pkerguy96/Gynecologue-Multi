<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NurseRoleResource;
use App\Http\Resources\RoleCollection;
use App\Http\Resources\RoleResource;
use App\Models\User;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Exceptions\RoleDoesNotExist;
use Illuminate\Support\Facades\Log;

class PermissionController extends Controller
{
    use UserRoleCheck;
    use HttpResponses;
    public function createRole(Request $request)
    {
        //TODO: CHECK THIS for multi
        try {
            $user = auth()->user();
            if ($user->role === 'nurse') {
                return $this->error(null, 'Seuls les médecins sont autorisés à accéder.', 401);
            }
            setPermissionsTeamId($user);
            // Validate the incoming request
            $validated = $request->validate([
                'rolename' => 'required|string|unique:roles,name',
            ]);
            $existingRole = Role::where('name', $request->rolename)->where('team_id', $user->id)->first();

            if ($existingRole) {
                return $this->error(null, 'Le rôle existe déjà', 409);
            }
            // Create the role
            $role = Role::create([
                'name' => $validated['rolename'],
                'team_id' => $user->id,
                'guard_name' => 'sanctum', // Use the appropriate guard
            ]);
            app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
            // Return a success response using the trait
            return $this->success($role, 'Role created successfully.', 201);
        } catch (\Throwable $th) {
            // Return an error response using the trait
            return $this->error(null, $th->getMessage(), 500);
        }
    }
    public function getUsersViaRoles()
    {
        $doctorId = $this->checkUserRole();

        try {
            $roles = Role::where('team_id', $doctorId)->where('name', '!=', 'doctor')
                ->with('users') // Include users for other roles
                ->get();
            return new RoleCollection($roles);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }


    public function getRoles()
    {
        try {
            $doctorId = $this->checkUserRole();
            $authenticatedUser = auth()->user();
            if ($authenticatedUser->role === 'nurse') {
                return $this->error(null, 'Seuls les médecins sont autorisés à accéder.', 401);
            }
            $roles = Role::where('team_id', $doctorId)->where('name', '!=', 'doctor')->get();
            $rolesResource  = RoleResource::collection($roles);
            return $this->success($rolesResource, 'success', 201);
        } catch (\Throwable $th) {
            $this->error($th->getMessage(), 'error', 501);
        }
    }

    public function grantAccess(Request $request)
    {
        try {
            $user = auth()->user();

            // Check if the current user is allowed to grant access
            if ($user->role === 'nurse') {
                Log::error("Unauthorized: Nurses cannot grant permissions", ['user_id' => $user->id]);
                return $this->error(null, 'Seuls les médecins sont autorisés à accéder.', 403);
            }

            // Ensure permissions are set for the correct team
            setPermissionsTeamId($user);
            Log::info("Team ID Set for Permissions", ['user_id' => $user->id, 'team_id' => $user->team_id]);

            // Check if the nurse exists
            $nurse = User::find($request->nurseid);
            if (!$nurse) {
                Log::error("Nurse Not Found", ['nurse_id' => $request->nurseid]);
                return $this->error(null, "Aucune infirmière n'a été trouvée", 404);
            }
            Log::info("Nurse Found", ['nurse_id' => $nurse->id]);

            // Check if the role exists for the correct team
            $role = Role::where('name', $request->rolename)
                ->where('guard_name', 'sanctum')
                ->where('team_id', $user->id) // Ensure role belongs to correct team
                ->first();

            if (!$role) {
                Log::error("Role Not Found", [
                    'role_name' => $request->rolename,
                    'guard_name' => 'sanctum',
                    'team_id' => $user->id
                ]);
                throw RoleDoesNotExist::named($request->rolename, 'sanctum');
            }
            Log::info("Role Found", ['role' => $role->toArray()]);

            // Get permissions from request
            $permissions = $request->permissions;
            if (empty($permissions)) {
                Log::warning("No Permissions Provided", ['role' => $role->name]);
                return $this->error(null, "Aucune permission fournie.", 400);
            }
            Log::info("Permissions to Assign", ['role' => $role->name, 'permissions' => $permissions]);

            // Ensure all requested permissions exist in the database
            $existingPermissions = Permission::whereIn('name', $permissions)->pluck('name')->toArray();
            $missingPermissions = array_diff($permissions, $existingPermissions);

            if (!empty($missingPermissions)) {
                Log::error("Some Permissions Do Not Exist", ['missing_permissions' => $missingPermissions]);
                return $this->error(null, "Les permissions suivantes n'existent pas: " . implode(", ", $missingPermissions), 400);
            }

            // Assign permissions to role
            Log::info("Syncing Permissions to Role", ['role' => $role->name, 'assigned_permissions' => $existingPermissions]);
            $role->syncPermissions([]); // Clear old permissions
            $role->syncPermissions($existingPermissions); // Assign new permissions

            // Remove old roles from nurse and assign the new one
            $oldRoles = $nurse->roles->pluck('name')->toArray();
            Log::info("Removing Old Roles from Nurse", ['nurse_id' => $nurse->id, 'old_roles' => $oldRoles]);

            foreach ($nurse->roles as $singleRole) {
                $nurse->removeRole($singleRole);
            }

            Log::info("Assigning New Role to Nurse", ['nurse_id' => $nurse->id, 'new_role' => $role->name]);
            $nurse->assignRole($role->name);

            // Clear cached permissions
            app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
            Log::info("Permissions Cache Cleared");

            return $this->success(null, "L'autorisation a été mise à jour avec succès.", 201);
        } catch (RoleDoesNotExist $exception) {
            Log::error("Role Does Not Exist Exception", ['message' => $exception->getMessage()]);
            return $this->error(null, $exception->getMessage(), 500);
        } catch (\Throwable $th) {
            Log::error("Unhandled Exception", ['message' => $th->getMessage(), 'trace' => $th->getTraceAsString()]);
            return $this->error(null, $th->getMessage(), 500);
        }
    }
    public function userPermissions(Request $request)
    {
        try {

            $user = auth()->user();
            if ($user->role === 'nurse') {
                return $this->error(null, 'Seuls les médecins sont autorisés à accéder.', 501);
            }

            $role = Role::where('name', $request->rolename)
                ->where('guard_name', 'sanctum')
                ->where('team_id', $user->id)
                ->first();
            if (!$role) {
                throw RoleDoesNotExist::named($request->rolename, 'sanctum');
            }
            $permissions = $role->permissions->pluck('name')->toArray();
            return $this->success($permissions, 'success', 201);
        } catch (RoleDoesNotExist $exception) {

            return $this->error(null, $exception->getMessage(), 500);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }
    public function RolesNursesList()
    {
        $doctorId = $this->checkUserRole();
        $authenticatedUserId = auth()->user();
        if ($authenticatedUserId->role === 'nurse') {
            return $this->error(null, 'Only doctors are allowed access!', 401);
        }
        $nurses = User::where('doctor_id', $doctorId)->where('role', 'nurse')->get();
        $data =  NurseRoleResource::collection($nurses);
        return $this->success($data, 'success', 200);
    }
    public function deleteRole($id)
    {
        try {
            $user = auth()->user();
            if ($user->role === 'nurse') {
                return $this->error(null, 'Seuls les médecins sont autorisés à accéder.', 501);
            }
            setPermissionsTeamId($user);

            $role = Role::where('id', $id)->where('team_id', $user->id)->first();
            $role->delete();
            app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            return $this->success(null, 'deleted success', 201);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }
}
