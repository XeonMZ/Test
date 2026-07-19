<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * #1 Full-custom seat maps. Adds grid coordinates + a cell type to
 * vehicle_seats so operators can lay out a coach exactly like a physical
 * floor plan: seats, aisles, driver cell, doors, and empty gaps.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicle_seats', function (Blueprint $table): void {
            if (! Schema::hasColumn('vehicle_seats', 'row_index')) {
                $table->unsignedSmallInteger('row_index')->default(0)->after('seat_number');
            }
            if (! Schema::hasColumn('vehicle_seats', 'column_index')) {
                $table->unsignedSmallInteger('column_index')->default(0)->after('row_index');
            }
            if (! Schema::hasColumn('vehicle_seats', 'cell_type')) {
                // seat | aisle | driver | door | empty
                $table->string('cell_type', 16)->default('seat')->after('column_index');
            }
            if (! Schema::hasColumn('vehicle_seats', 'label')) {
                $table->string('label', 32)->nullable()->after('cell_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_seats', function (Blueprint $table): void {
            foreach (['row_index', 'column_index', 'cell_type', 'label'] as $col) {
                if (Schema::hasColumn('vehicle_seats', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
