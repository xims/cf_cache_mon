EXTFILES = js css icons jq *.html manifest.json README*

all: clean create_dist zip_it

clean: 
	rm -f *~
	rm -f */*~
	rm -r dist

create_dist: 
	mkdir -p dist/cf_cache_mon
	cp -r $(EXTFILES) dist/cf_cache_mon/

zip_it: 
	cd dist ; zip -r cf_cache_mon.zip cf_cache_mon