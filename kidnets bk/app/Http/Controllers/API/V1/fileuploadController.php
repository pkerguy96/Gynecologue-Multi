<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\doctorfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\File_Upload;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Patient;
use App\Traits\FileUpload;
use App\Traits\HttpResponses;
use App\Traits\UserRoleCheck;
use Illuminate\Support\Str;
use ZipArchive;
use Illuminate\Support\Facades\DB;

class fileuploadController extends Controller
{
    use HttpResponses;
    use FileUpload;
    use UserRoleCheck;
    /**
     * Display a listing of the resource.
     */

    public function index(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();

            // Retrieve search query and pagination parameters
            $searchQuery = $request->input('searchQuery');
            $perPage = $request->get('per_page', 20);

            // Start the query
            $query = file_upload::where('doctor_id', $doctorId)->select('cluster', 'folder_path', 'created_at', 'type', 'patient_id')
                ->groupBy('cluster', 'folder_path', 'created_at', 'type', 'patient_id');

            // Apply search filters if a query is provided
            if (!empty($searchQuery)) {
                $query->where(function ($subQuery) use ($searchQuery) {
                    $subQuery->where('type', 'like', "%{$searchQuery}%")
                        ->orWhere('created_at', 'like', "%{$searchQuery}%");

                    // Join with patients table for name search
                    $subQuery->orWhereHas('patient', function ($patientQuery) use ($searchQuery) {
                        $patientQuery->where('nom', 'like', "%{$searchQuery}%")
                            ->orWhere('prenom', 'like', "%{$searchQuery}%");
                    });
                });
            }

            // Paginate the results
            $patientClusters = $query->paginate($perPage);

            // Format the results with URLs
            $patientClusters->getCollection()->transform(function ($file) {
                $cluster = $file->cluster;
                $file->urls = Storage::disk('public')->url($file->folder_path);
                return $file;
            });

            // Return paginated response
            return response()->json($patientClusters, 200);
        } catch (\Throwable $th) {
            Log::error($th);
            return response()->json(['error' => 'An error occurred while retrieving the file URLs'], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();

            if ($request->hasFile('files')) {

                $patient  = Patient::where('doctor_id', $doctorId)->where('id', $request->patient_id)->firstOrFail();
                $patientFolder = $patient->p_folder;

                $uploadedFiles = $request->file('files');

                $cluster = 'cluster' . Str::random(10);
                $counter = 1;
                foreach ($uploadedFiles as $uploadedFile) {

                    $originalFilename = $uploadedFile->getClientOriginalName();
                    $newFilename = 'dicom_' . $counter . '_' . Str::random(5) . '.' . $uploadedFile->getClientOriginalExtension();
                    $path = $this->UploadFile($uploadedFile, $patientFolder, '', 'public', $newFilename);

                    file_upload::create([
                        'doctor_id' => $doctorId,
                        'patient_id' => $request->patient_id,
                        'original_name' => $originalFilename,
                        'folder_path' => $path,
                        'type' => $request->type,
                        'cluster' => $cluster,
                        'order' => $counter
                    ]);
                    $counter++;
                }
                return response()->json([
                    'message' => 'upload created successfully',
                ], 201);
            }
        } catch (\Throwable $th) {
            // Log the exception for debugging
            Log::error($th);

            return response()->json([
                'message' => 'An error occurred during file upload.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        try {
            $doctorId = $this->checkUserRole();

            $patientClusters = file_upload::where('doctor_id', $doctorId)->select('cluster', 'folder_path', DB::raw('MAX(`order`) as file_order'))
                ->where('cluster', $id)
                ->groupBy('cluster', 'folder_path')
                ->orderBy('file_order', 'asc') // Order by the aggregated order column
                ->get();
            if ($patientClusters->isEmpty()) {
                return response()->json(['error' => 'empty'], 404);
            }

            $data = [];
            foreach ($patientClusters as $file) {
                $url = asset("storage/" . $file->folder_path);
                $data[] = $url;
            }

            return view('welcome', compact('data'));
        } catch (\Throwable $th) {
            Log::error($th);
            return response()->json(['error' => 'An error occurred while retrieving the file URLs'], 500);
        }
    }


    public function uploadsInfo(Request $request)
    {
        try {
            $doctorId = $this->checkUserRole();

            $patientClusters = file_upload::where('doctor_id', $doctorId)->select('cluster', 'folder_path', 'created_at', 'patient_id', 'type', 'original_name')
                ->groupBy('cluster', 'folder_path', 'created_at', 'patient_id', 'type', 'original_name')
                ->get();

            if ($patientClusters->isEmpty()) {
                return response()->json(['error' => 'No files found for the patient', 'data' => []]);
            }
            $datesByClusters = [];
            $sizesByClusters = [];
            $clusterType = [];
            $clusterMime = [];
            $patients = [];
            foreach ($patientClusters as $file) {
                $cluster = $file->cluster;

                // Calculate size of each file
                $sizeInBytes = Storage::disk('public')->size($file->folder_path);
                $sizeInKB = $sizeInBytes / 1024 / 1024;
                $sizesByClusters[$cluster][] = $sizeInKB;

                // Collect file dates
                $datesByClusters[$cluster][] = $file->created_at->toDateTimeString();

                // Collect MIME types and types
                $clusterMime[$cluster][] = Storage::disk('public')->mimeType($file->folder_path);
                $clusterType[$cluster][] = $file->type;

                // Collect patient info
                if (!isset($patients[$cluster][$file->patient_id])) {
                    $patientInfo = Patient::withTrashed()->find($file->patient_id);
                    $patients[$cluster][$file->patient_id] = [
                        'nom' => $patientInfo->nom . ' ' . $patientInfo->prenom,
                    ];
                }
            }

            // Prepare final response
            $Uploadsinfo = [];
            foreach ($sizesByClusters as $cluster => $sizes) {
                $Uploadsinfo[$cluster] = [
                    'patientName' => array_values($patients[$cluster]),
                    'clusterName' => $cluster,
                    'type' => $clusterType[$cluster][0],
                    'dates' => $datesByClusters[$cluster],
                    'totalSize' => array_sum($sizes),
                    'mimeType' => $clusterMime[$cluster],
                ];
            }

            // Return response
            return response()->json(['data' => $Uploadsinfo], 200)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token, Authorization');
        } catch (\Throwable $th) {
            Log::error($th);
            return response()->json(['error' => 'An error occurred while retrieving the file URLs'], 500);
        }
    }

    /* ZIp downlload function */
    public function downloadZip(Request $request, $clusterId)
    {
        try {
            $doctorId = $this->checkUserRole();

            $files = file_upload::where('doctor_id', $doctorId)->where('cluster', $clusterId)->get();
            if ($files->isEmpty()) {
                return response()->json(['error' => 'No files found for this cluster'], 404);
            }

            $zip = new ZipArchive;
            $zipFileName = "download_{$clusterId}.zip";
            $zipPath = storage_path("app/public/" . $zipFileName);

            if ($zip->open($zipPath, ZipArchive::CREATE) === TRUE) {
                foreach ($files as $file) {
                    $zip->addFile(storage_path("app/public/{$file->folder_path}"), basename($file->folder_path));
                }
                $zip->close();
            }

            return response()->download($zipPath)->deleteFileAfterSend();
        } catch (\Throwable $th) {
            Log::error($th);
            return response()->json(['error' => 'Failed to generate ZIP file'], 500);
        }
    }


    public function storeDoctorFile(Request $request)
    {
        try {
            // Step 1: Get the doctor's ID
            $doctorId = $this->checkUserRole();

            // Step 2: Define the doctor's storage folder
            $doctorFolder = "public/doctors/{$doctorId}";

            // Step 3: Ensure the doctor's folder exists
            if (!Storage::exists($doctorFolder)) {
                Storage::makeDirectory($doctorFolder);
            }

            // Step 4: Validate the incoming files
            $request->validate([
                'files' => 'required|array',
                'files.*' => 'required|file|mimes:pdf,doc,docx|max:10240',
            ]);

            // Step 5: Check if files exist
            if (!$request->hasFile('files')) {

                return response()->json(['message' => 'No files provided for upload.'], 400);
            }

            // Step 6: Process each file separately
            $uploadedFiles = $request->file('files');
            $savedFiles = [];
            $failedFiles = [];

            foreach ($uploadedFiles as $uploadedFile) {
                try {
                    $originalFilename = $uploadedFile->getClientOriginalName();
                    $fileSize = $uploadedFile->getSize();
                    $fileMimeType = $uploadedFile->getMimeType();
                    $fileExtension = $uploadedFile->getClientOriginalExtension();
                    $tempPath = $uploadedFile->getPathname(); // Get temp storage path




                    // Generate unique filename
                    $newFilename = 'doc_' . time() . '_' . Str::random(5) . '.' . $fileExtension;

                    // Store file
                    $path = $uploadedFile->storeAs("doctors/{$doctorId}", $newFilename, 'public');

                    if (!$path) {
                        throw new \Exception("Storage failed for file: {$originalFilename}");
                    }

                    // Save to database
                    $fileRecord = doctorfile::create([
                        'doctor_id' => $doctorId,
                        'original_name' => $originalFilename,
                        'folder_path' => $path,
                        'type' => $fileMimeType,
                        'size' => $fileSize,
                    ]);

                    $savedFiles[] = $fileRecord;
                } catch (\Throwable $fileError) {

                    $failedFiles[] = ['filename' => $uploadedFile->getClientOriginalName(), 'error' => $fileError->getMessage()];
                }
            }

            // Return response
            return response()->json([
                'message' => empty($failedFiles) ? 'All files uploaded successfully' : 'Some files failed to upload.',
                'successful_files' => $savedFiles,
                'failed_files' => $failedFiles,
            ], empty($failedFiles) ? 201 : 207);
        } catch (\Throwable $th) {

            return response()->json(['message' => 'An error occurred during file upload.', 'error' => $th->getMessage()], 500);
        }
    }
    public function getDoctorFiles(Request $request)
    {
        try {
            // Step 1: Get the authenticated doctor's ID
            $doctorId = $this->checkUserRole();

            // Step 2: Retrieve files for this doctor
            $files = doctorfile::where('doctor_id', $doctorId)
                ->orderBy('created_at', 'desc')
                ->get();

            // Step 3: Format the response
            $formattedFiles = $files->map(function ($file) {
                return [
                    'id' => $file->id,
                    'filename' => $file->original_name,
                    'size' => $this->formatFileSize($file->size),
                    'type' => $file->type,
                    'created_at' => $file->created_at->format('Y-m-d H:i:s'),
                    /*  'file_url' => Storage::url($file->folder_path), // Generates a URL */
                ];
            });
            return $this->success($formattedFiles, 'Files retrieved successfully', 200);
        } catch (\Throwable $th) {
            Log::error("Failed to retrieve files: " . $th->getMessage());

            return response()->json([
                'message' => 'An error occurred while retrieving files.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    public function deleteDoctorFile(Request $request, $fileId)
    {
        try {
            // Step 1: Get the authenticated doctor's ID
            $doctorId = $this->checkUserRole();

            // Step 2: Find the file in the database
            $file = DoctorFile::where('id', $fileId)
                ->where('doctor_id', $doctorId)
                ->first();

            if (!$file) {
                return response()->json([
                    'message' => 'File not found or does not belong to the doctor.',
                ], 404);
            }

            // Step 3: Delete the file from storage
            if (Storage::exists('public/' . $file->folder_path)) {
                Storage::delete('public/' . $file->folder_path);
            }

            // Step 4: Remove file record from the database
            $file->delete();

            Log::info("Doctor {$doctorId} deleted file: {$file->original_name}");

            return response()->json([
                'message' => 'File deleted successfully',
            ], 200);
        } catch (\Throwable $th) {
            Log::error("File deletion failed: " . $th->getMessage());

            return response()->json([
                'message' => 'An error occurred while deleting the file.',
                'error' => $th->getMessage(),
            ], 500);
        }
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $doctorId = $this->checkUserRole();
            $files = file_upload::where('doctor_id', $doctorId)->where('cluster', $id)->get();
            if ($files->isEmpty()) {
                return $this->error(null, 'No cluster found', 404);
            }
            foreach ($files as $file) {

                Storage::disk('public')->delete($file->folder_path);
            }
            foreach ($files as $file) {
                $file->delete();
            }
            Storage::disk('public')->delete("download_{$files[0]->cluster}.zip");
            return $this->success(null, 'Files deleted successfully', 200);
        } catch (\Throwable $th) {
            Log::error($th);
            return $this->error(null, $th, 404);
        }
    }
}
