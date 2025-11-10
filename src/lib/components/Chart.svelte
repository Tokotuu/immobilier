<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
    Tooltip,
    Legend,
    type ChartConfiguration,
  } from 'chart.js';

  interface Props {
    config: ChartConfiguration;
  }

  let { config }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart;

  onMount(() => {
    // Register Chart.js components
    Chart.register(
      LineController,
      LineElement,
      PointElement,
      LinearScale,
      CategoryScale,
      Title,
      Tooltip,
      Legend
    );

    chart = new Chart(canvas, config);

    return () => {
      chart.destroy();
    };
  });

  $effect(() => {
    if (chart) {
      chart.data = config.data;
      chart.options = config.options || {};
      chart.update();
    }
  });
</script>

<canvas bind:this={canvas}></canvas>
