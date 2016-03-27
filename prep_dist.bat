if exist dist rd /s /q dist
mkdir dist\cf_cache_mon 

xcopy js dist\cf_cache_mon\js /E /Y /D /i 
xcopy css dist\cf_cache_mon\css /E /Y /D /i
xcopy icons dist\cf_cache_mon\icons /E /Y /D /i
xcopy jq dist\cf_cache_mon\jq /E /Y /D /i

copy cf_cache_mon.html dist\cf_cache_mon\
copy manifest.json dist\cf_cache_mon\
copy README.* dist\cf_cache_mon\

pause