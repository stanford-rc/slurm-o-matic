SLURM*O*MATIC
===============

This tool helps users generate SLURM batch scripts. As job parameters are entered into the form, the SLURM script is generated in real time.

## Installation
* Git Clone the repository or download a tag release.  Place in a web accessable folder

* Copy includes/config.json.dist to includes/config.json
```
cp includes/config.json.dist includes/config.json
```
## Configuration
* Edit includes/config.json for the page title and location of apps.txt
```
"config": {
	"title": "Slurm*O*Matic",
	"apps_url": "/includes/modules.txt"
},
```
* The apps.txt can be generated for Lmod with the following command
```
module -t avail
```
Copy the contents into the file /includes/modules.txt (or whatever location is set in config.json)
* Edit config.json for your cluster specifications
 
```
		{
			"name": "normal",
			"cpu": "Dual Core Intel Xeon Gold 6130 (16C 2.1GHz)",
			"memory": "384GB",
			"memoryNum":384,# same as "memory" without the GB, so it can be used to set dropdowns
			"nodes": "2",#maximum number that can be requested
			"display_nodes" : "16", #what shows up in the resource table
			"cores" : 256
		},
		{
			"name": "gpu",
			"cpu": "Dual Core Intel Xeon Gold 6130 (16C 2.1GHz)",
			"memory":"384GB",
			"memoryNum":384,
			"nodes": "2", 
			"display_nodes" : "2",
			"gpus" : "Dual P100",
			"gpuFlag" : "#SBATCH -C GPU_SKU:P100_PCIE",
			"cores" : 32,
			"gpuId" : "P100_PCIE"
		},
```
I cribbed from multiple sources to create whatever this is, including IGBIllinois/SLURM_generator