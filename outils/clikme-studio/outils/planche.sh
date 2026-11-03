# planche.sh sortie largeur colonnes fichiers...
out=$1; w=$2; c=$3; shift 3; n=$#; h=$((w*16/9)); args=""; f=""; lay=""
k=0; for x in "$@"; do args="$args -i $x"; f="$f[$k]scale=$w:$h,drawtext=text='$(basename $x .jpg)':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6[v$k];"; k=$((k+1)); done
for k in $(seq 0 $((n-1))); do f="$f[v$k]"; lay="$lay$([ $k -gt 0 ] && echo '|')$(( (k%c)*w ))_$(( (k/c)*h ))"; done
ffmpeg -v error -y $args -filter_complex "${f}xstack=inputs=$n:layout=$lay:fill=black" $out
