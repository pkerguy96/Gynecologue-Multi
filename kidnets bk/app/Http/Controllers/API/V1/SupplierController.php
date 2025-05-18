<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Http\Resources\SupplierResourceNameId;
use App\Models\Supplier;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    use HttpResponses;
    use UserRoleCheck;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {

        $doctorId = $this->checkUserRole(['superadmin', 'access_supplier']);
        $searchQuery = $request->input('searchQuery');

        // Default query to paginate suppliers
        $suppliers = Supplier::where('doctor_id', $doctorId)->orderBy('id', 'desc')->paginate($request->get('per_page', 20));

        if (!empty($searchQuery)) {
            // Apply search filters if a search query is provided
            $suppliers = Supplier::where('doctor_id', $doctorId)->where(function ($query) use ($searchQuery) {
                $query->Where('address', 'like', "%{$searchQuery}%")
                    ->orWhere('phone', 'like', "%{$searchQuery}%")
                    ->orWhere('email', 'like', "%{$searchQuery}%")
                    ->orWhere('contact_person', 'like', "%{$searchQuery}%")
                    ->orWhere('company_name', 'like', "%{$searchQuery}%")
                    ->orWhere('supply_type', 'like', "%{$searchQuery}%");
                // Add more fields to search if necessary
            })
                ->orderBy('id', 'desc')
                ->paginate($request->get('per_page', 20));
        }

        return SupplierResource::collection($suppliers);
    }
    public function showAllSuppliers()
    {
        $doctorId = $this->checkUserRole(['superadmin', 'access_supplier']);
        try {
            $suppliers =  Supplier::where('doctor_id', $doctorId)->where('status', 'active')->get();
            return SupplierResourceNameId::collection($suppliers);
        } catch (\Throwable $th) {
            return $this->error(null, $th->getMessage(), 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSupplierRequest $request)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'add_supplier']);
        $data = $request->validated();
        $data['doctor_id'] = $doctorId;
        $supplier = Supplier::create($data);
        return response()->json(['message' => 'Fournisseur créé avec succès.', 'data' => $supplier], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'access_supplier']);
        $supplier = Supplier::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();
        if (!$supplier) {
            return $this->error(null, 'Fournisseur non trouvé.', 404);
        }
        return new SupplierResource($supplier);
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(StoreSupplierRequest $request, string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'modify_supplier']);
        $supplier = Supplier::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();

        if (!$supplier) {
            return response()->json(['message' => 'Fournisseur non trouvé.'], 404);
        }

        $supplier->update($request->validated());
        return response()->json(['message' => 'Fournisseur mis à jour avec succès.', 'data' => $supplier], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $doctorId = $this->checkUserRole(['superadmin', 'delete_supplier']);
        $supplier = Supplier::where('doctor_id', $doctorId)->where('id', $id)->firstOrFail();
        if (!$supplier) {
            return response()->json(['message' => 'Fournisseur non trouvé.'], 404);
        }

        $supplier->delete(); 
        return response()->json(['message' => 'Fournisseur supprimé avec succès.'], 200);
    }
}
