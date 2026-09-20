import styles from './Placeholder.module.css';

export default function Placeholder({ title }: { title: string }) {
  return (
    <div className={styles.wrap}>
      <h1>{title}</h1>
      <p>Section coming next — header is done, page content will follow the tecfi.it layout.</p>
    </div>
  );
}
