module github.com/ethanbaker/notion/integrations/ticktick

replace github.com/ethanbaker/notion/integrations/ticktick/ticktickapi => ./ticktickapi

go 1.18

require github.com/dstotijn/go-notion v0.6.1

require (
	github.com/ethanbaker/notion/integrations/ticktick/ticktickapi v0.0.0-00010101000000-000000000000 // indirect
	github.com/unixpickle/essentials v0.0.0-20180916162721-ae02bc395f1d // indirect
)
