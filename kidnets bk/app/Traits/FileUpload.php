<?php

namespace App\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait FileUpload
{
    /*   public function UploadFile(UploadedFile $file, $folder = null, $disk = 'public', $filename = null)
    {
        $FileName = !is_null($filename) ? $filename : Str::random(10);
        return $file->storeAs(
            $folder,
            $FileName . "." . $file->getClientOriginalExtension(),
            $disk
        );
    } */
    public function UploadFile(UploadedFile $file, $patientFolder, $folder = null, $disk = 'public', $filename = null)
    {
        $FileName = !is_null($filename) ? $filename : Str::random(10);
        $path = $patientFolder;

        return $file->storeAs(
            $path,
            $FileName,
            $disk
        );
    }
    public function deleteFile($path, $disk = 'public')
    {
        Storage::disk($disk)->delete($path);
    }
    function formatFileSize($size)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor((strlen($size) - 1) / 3);
        return sprintf("%.2f", $size / pow(1024, $factor)) . " " . $units[$factor];
    }
}
