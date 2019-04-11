FILENAME = main

make:
	rm -f ${FILENAME}.pdf
	latex ${FILENAME}
	latex ${FILENAME}
	dvips ${FILENAME}.dvi
	ps2pdf ${FILENAME}.ps
	rm -f ${FILENAME}.aux
	rm -f ${FILENAME}.dvi
	rm -f ${FILENAME}.log
	rm -f ${FILENAME}.ps
	rm -f ${FILENAME}.bbl
	rm -f ${FILENAME}.blg
	rm -f ${FILENAME}.toc
	echo "PDF is complete."

clean:
	rm -f ${FILENAME}.pdf
	rm -f ${FILENAME}.aux
	rm -f ${FILENAME}.dvi
	rm -f ${FILENAME}.log
	rm -f ${FILENAME}.ps
	rm -f ${FILENAME}.bbl
	rm -f ${FILENAME}.blg
