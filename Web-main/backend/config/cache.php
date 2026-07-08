<?php
return ['default'=>env('CACHE_STORE','redis'),'stores'=>['array'=>['driver'=>'array'],'file'=>['driver'=>'file','path'=>storage_path('framework/cache/data')],'redis'=>['driver'=>'redis','connection'=>'cache']],'prefix'=>env('CACHE_PREFIX','stms_cache')];
