const StatCard = ({ icon, label, value, color = 'primary', subtitle }) => {
  const colorStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
  };

  const textStyles = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  };

  return (
    <div className="bg-surface rounded-xl border border-border-light card-shadow p-4 sm:p-6 transition-transform hover:-translate-y-1 duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-text-muted truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-semibold text-text-main mt-0.5 sm:mt-1 truncate" title={value}>{value}</p>
          {subtitle && <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
